import type {
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common'
import type { ErrorApiResponse } from '../interceptors'
import type { ExceptionContext, ExceptionStrategy } from './interfaces'
import { randomUUID } from 'node:crypto'
import {
  Catch,
  HttpException,
} from '@nestjs/common'

import { LoggerService } from '../../modules/logger'
import {
  AuthorizationExceptionStrategy,
  BusinessExceptionStrategyImpl,
  DefaultExceptionStrategy,
  HttpExceptionStrategyImpl,
  PipeExceptionStrategy,
  ValidationExceptionStrategyImpl,
} from './strategies'

// 定义 Fastify 请求和响应的基本接口
interface FastifyRequest {
  method: string
  url: string
  ip?: string
  headers: Record<string, string | string[] | undefined>
}

interface FastifyReply {
  status: (code: number) => FastifyReply
  send: (payload: unknown) => FastifyReply
}

/**
 * 全局异常过滤器
 * 负责统一处理应用程序中的所有异常
 * 使用策略模式支持不同类型异常的处理
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly strategies: ExceptionStrategy[]

  constructor(private readonly logger: LoggerService) {
    // 初始化异常处理策略（按优先级排序）
    this.strategies = [
      new BusinessExceptionStrategyImpl(), // 优先级: 150
      new AuthorizationExceptionStrategy(), // 优先级: 125
      new ValidationExceptionStrategyImpl(), // 优先级: 120
      new PipeExceptionStrategy(), // 优先级: 110
      new HttpExceptionStrategyImpl(), // 优先级: 100
      new DefaultExceptionStrategy(), // 优先级: 1 (兜底策略)
    ].sort((a, b) => b.priority - a.priority) // 按优先级降序排列
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const response = ctx.getResponse<FastifyReply>()

    // 生成请求跟踪ID
    const traceId = this.generateTraceId()

    // 创建异常处理上下文
    const context: ExceptionContext = {
      request: {
        method: request.method,
        url: request.url,
        ip: request.ip,
        headers: request.headers,
      },
      response: {
        status: (code: number) => response.status(code),
        send: (payload: unknown) => response.send(payload),
      },
      traceId,
      timestamp: new Date().toISOString(),
    }

    // 处理异常并获取响应数据
    const errorResponse = this.processExceptionWithStrategy(exception, context)

    // 记录错误日志
    this.logError(exception, request, errorResponse, traceId)

    // 发送响应
    response.status(errorResponse.error.statusCode).send(errorResponse)
  }

  /**
   * 使用策略模式处理异常
   */
  private processExceptionWithStrategy(
    exception: unknown,
    context: ExceptionContext,
  ): ErrorApiResponse {
    // 找到第一个能处理该异常的策略
    const strategy = this.findHandlingStrategy(exception, context)

    // 使用策略处理异常
    const handleResult = strategy.handle(exception, context)

    // 构建标准错误响应
    return this.buildErrorResponse(handleResult, context)
  }

  /**
   * 查找能处理异常的策略
   */
  private findHandlingStrategy(exception: unknown, context: ExceptionContext): ExceptionStrategy {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(exception, context)) {
        this.logger.debug(`Using strategy ${strategy.name} to handle exception`, {
          traceId: context.traceId,
          strategyName: strategy.name,
          priority: strategy.priority,
        })
        return strategy
      }
    }

    // 理论上不会到达这里，因为DefaultExceptionStrategy总是返回true
    // 但为了类型安全，返回默认策略
    return this.strategies[this.strategies.length - 1]
  }

  /**
   * 构建错误响应对象
   */
  private buildErrorResponse(
    handleResult: { statusCode: number, message: string, code: string, details?: unknown },
    context: ExceptionContext,
  ): ErrorApiResponse {
    return {
      success: false,
      error: {
        code: handleResult.code,
        message: handleResult.message,
        details: handleResult.details,
        timestamp: context.timestamp,
        path: context.request.url,
        method: context.request.method,
        statusCode: handleResult.statusCode,
        traceId: context.traceId,
      },
    }
  }

  /**
   * 记录错误日志
   */
  private logError(
    exception: unknown,
    request: FastifyRequest,
    errorResponse: ErrorApiResponse,
    traceId: string,
  ): void {
    const { method, url, ip, headers } = request
    const userAgent = (headers['user-agent'] as string) ?? ''

    const logContext = {
      traceId,
      method,
      url,
      clientIp: ip ?? 'unknown',
      userAgent,
      statusCode: errorResponse.error.statusCode,
      errorCode: errorResponse.error.code,
      errorMessage: errorResponse.error.message,
    }

    // 根据异常类型决定日志级别
    if (exception instanceof HttpException) {
      // HTTP 异常使用 warn 级别
      this.logger.warn('HTTP Exception', logContext)
    }
    else {
      // 其他异常使用 error 级别，并包含堆栈信息
      const errorDetails = {
        ...logContext,
        errorName: exception instanceof Error ? exception.name : 'Unknown',
        errorStack: exception instanceof Error && process.env.NODE_ENV !== 'production'
          ? exception.stack
          : undefined,
      }
      this.logger.error('Unhandled Exception', errorDetails)
    }
  }

  /**
   * 生成请求跟踪ID
   * 使用 Node.js 内置的 randomUUID 确保唯一性
   */
  private generateTraceId(): string {
    return randomUUID()
  }

  /**
   * 获取已注册的策略列表
   */
  getRegisteredStrategies(): ExceptionStrategy[] {
    return [...this.strategies]
  }

  /**
   * 添加新的异常处理策略
   */
  addStrategy(strategy: ExceptionStrategy): void {
    this.strategies.push(strategy)
    // 重新按优先级排序
    this.strategies.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 移除异常处理策略
   */
  removeStrategy(strategyName: string): boolean {
    const index = this.strategies.findIndex(s => s.name === strategyName)
    if (index !== -1) {
      this.strategies.splice(index, 1)
      return true
    }
    return false
  }
}

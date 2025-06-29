import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { ErrorApiResponse } from '../interceptors'
import type { FastifyReply, FastifyRequest } from './interfaces'
import { randomUUID } from 'node:crypto'
import { Catch, HttpException, HttpStatus } from '@nestjs/common'
import { LoggerService } from '../../modules/logger'
import { BusinessException } from './exceptions'

/**
 * 简化的全局异常过滤器
 * 统一处理所有异常，提供标准化的错误响应
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<FastifyRequest>()
    const response = ctx.getResponse<FastifyReply>()

    // 生成请求跟踪ID
    const traceId = randomUUID()
    const timestamp = new Date().toISOString()

    // 处理异常并获取响应数据
    const { errorResponse, statusCode } = this.buildErrorResponse(exception, request, traceId, timestamp)

    // 记录错误日志
    this.logError(exception, request, errorResponse, traceId, statusCode)

    // 发送响应
    response.status(statusCode).send(errorResponse)
  }

  /**
   * 构建错误响应
   */
  private buildErrorResponse(
    exception: unknown,
    request: FastifyRequest,
    traceId: string,
    timestamp: string,
  ): { errorResponse: ErrorApiResponse, statusCode: number } {
    let statusCode: number
    let message: string
    let code: string
    let details: unknown

    // 1. 业务异常
    if (exception instanceof BusinessException) {
      statusCode = exception.statusCode
      message = exception.message
      code = exception.code
      details = exception.details
    }
    // 2. HTTP异常（包括验证异常）
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const response = exception.getResponse()

      if (typeof response === 'string') {
        message = response
        code = this.getHttpErrorCode(statusCode)
      }
      else if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>
        message = this.extractMessage(responseObj, exception.message)
        code = this.getHttpErrorCode(statusCode)
        details = responseObj
      }
      else {
        message = exception.message
        code = this.getHttpErrorCode(statusCode)
      }
    }
    // 3. 系统异常（未知错误）
    else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR
      message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : exception instanceof Error ? exception.message : 'Unknown Error'
      code = 'INTERNAL_ERROR'

      // 开发环境包含错误详情
      if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
        details = {
          name: exception.name,
          stack: exception.stack,
        }
      }
    }

    return {
      errorResponse: {
        success: false,
        error: {
          code,
          message,
          details,
        },
        timestamp,
        traceId,
      },
      statusCode,
    }
  }

  /**
   * 从响应对象中提取消息
   */
  private extractMessage(responseObj: Record<string, unknown>, fallback: string): string {
    if (typeof responseObj.message === 'string') {
      return responseObj.message
    }

    if (Array.isArray(responseObj.message)) {
      return responseObj.message.join('; ')
    }

    return fallback
  }

  /**
   * 获取HTTP错误码
   */
  private getHttpErrorCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST'
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED'
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN'
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND'
      case HttpStatus.CONFLICT:
        return 'CONFLICT'
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR'
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT'
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_ERROR'
      default:
        return `HTTP_${statusCode}`
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
    statusCode: number,
  ): void {
    const logContext = {
      traceId,
      method: request.method,
      url: request.url,
      clientIp: request.ip ?? 'unknown',
      userAgent: (request.headers['user-agent'] as string) ?? '',
      statusCode,
      errorCode: errorResponse.error.code,
      errorMessage: errorResponse.error.message,
    }

    // 根据异常类型选择日志级别
    if (exception instanceof BusinessException || exception instanceof HttpException) {
      // 业务异常和HTTP异常使用warn级别
      this.logger.warn('Application Exception', logContext)
    }
    else {
      // 系统异常使用error级别
      const errorDetails = {
        ...logContext,
        errorName: exception instanceof Error ? exception.name : 'Unknown',
        errorStack: exception instanceof Error && process.env.NODE_ENV !== 'production'
          ? exception.stack
          : undefined,
      }
      this.logger.error('System Exception', errorDetails)
    }
  }
}

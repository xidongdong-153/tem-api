import type { ExceptionContext, ExceptionHandleResult, ExceptionStrategy } from '../interfaces'

import { HttpStatus } from '@nestjs/common'
import { getErrorCodeFromStatus } from '../constants'

/**
 * 默认异常处理策略
 * 作为兜底策略处理所有未被其他策略处理的异常
 */
export class DefaultExceptionStrategy implements ExceptionStrategy {
  readonly name = 'DefaultExceptionStrategy'
  readonly priority = 1 // 最低优先级，作为兜底策略

  /**
   * 可以处理任何异常（兜底策略）
   */
  canHandle(_exception: unknown, _context: ExceptionContext): boolean {
    return true
  }

  /**
   * 处理未知异常
   */
  handle(exception: unknown, _context: ExceptionContext): ExceptionHandleResult {
    // 处理Error类型异常
    if (exception instanceof Error) {
      return this.handleGenericError(exception)
    }

    // 处理完全未知的异常
    return this.handleUnknownException(exception)
  }

  /**
   * 处理普通Error异常
   */
  private handleGenericError(exception: Error): ExceptionHandleResult {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    const isProduction = process.env.NODE_ENV === 'production'

    return {
      statusCode,
      message: isProduction
        ? 'Internal server error'
        : exception.message,
      code: getErrorCodeFromStatus(statusCode),
      details: isProduction
        ? undefined
        : {
            errorName: exception.name,
            errorMessage: exception.message,
            // 在非生产环境包含堆栈信息
            stack: exception.stack,
          },
    }
  }

  /**
   * 处理完全未知的异常
   */
  private handleUnknownException(exception: unknown): ExceptionHandleResult {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    const isProduction = process.env.NODE_ENV === 'production'

    return {
      statusCode,
      message: 'Unknown error',
      code: 'UNKNOWN_ERROR',
      details: isProduction
        ? undefined
        : {
            exceptionType: typeof exception,
            exceptionValue: this.safeStringify(exception),
          },
    }
  }

  /**
   * 安全地序列化异常对象
   */
  private safeStringify(value: unknown): string {
    try {
      if (value === null)
        return 'null'
      if (value === undefined)
        return 'undefined'
      if (typeof value === 'string')
        return value
      if (typeof value === 'number' || typeof value === 'boolean')
        return String(value)

      // 尝试JSON序列化
      return JSON.stringify(value, this.getCircularReplacer(), 2)
    }
    catch {
      // 如果序列化失败，返回类型信息
      return `[${typeof value}] ${Object.prototype.toString.call(value)}`
    }
  }

  /**
   * 获取循环引用替换器
   */
  private getCircularReplacer() {
    const seen = new WeakSet()
    return (_key: string, value: unknown) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
      }
      return value
    }
  }

  /**
   * 判断是否应该记录详细日志
   */
  shouldLogDetails(exception: unknown): boolean {
    // Error类型的异常应该记录详细信息
    if (exception instanceof Error) {
      return true
    }

    // 非生产环境记录所有异常的详细信息
    return process.env.NODE_ENV !== 'production'
  }

  /**
   * 获取异常的简要描述
   */
  getExceptionSummary(exception: unknown): string {
    if (exception instanceof Error) {
      return `${exception.name}: ${exception.message}`
    }

    if (typeof exception === 'string') {
      return exception
    }

    return `Unknown exception: ${typeof exception}`
  }
}

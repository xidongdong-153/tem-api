import type { ExceptionContext, ExceptionHandleResult, HttpExceptionStrategy } from '../interfaces'

import { HttpException, HttpStatus } from '@nestjs/common'
import { getErrorCodeFromStatus } from '../constants'

/**
 * HTTP异常处理策略
 * 专门处理NestJS的HttpException及其子类
 */
export class HttpExceptionStrategyImpl implements HttpExceptionStrategy {
  readonly name = 'HttpExceptionStrategy'
  readonly priority = 100

  /**
   * 判断是否可以处理该异常
   */
  canHandle(exception: unknown): boolean {
    return exception instanceof HttpException
  }

  /**
   * 处理HTTP异常
   */
  handle(exception: unknown, _context: ExceptionContext): ExceptionHandleResult {
    if (!this.canHandle(exception)) {
      throw new Error('HttpExceptionStrategy cannot handle this exception')
    }

    const httpException = exception as HttpException
    const errorInfo = this.extractErrorInfo(httpException)

    return errorInfo
  }

  /**
   * 从HTTP异常中提取错误信息
   */
  extractErrorInfo(exception: unknown): {
    statusCode: number
    message: string
    code: string
    details?: unknown
  } {
    const httpException = exception as HttpException
    const statusCode = httpException.getStatus()
    const response = httpException.getResponse()

    // 处理字符串响应
    if (typeof response === 'string') {
      return {
        statusCode,
        message: response,
        code: getErrorCodeFromStatus(statusCode),
      }
    }

    // 处理对象响应
    if (typeof response === 'object' && response !== null) {
      const responseObj = response as Record<string, unknown>
      const message = this.extractMessageFromResponse(responseObj, httpException.message)
      const code = (responseObj.error as string) || getErrorCodeFromStatus(statusCode)
      const details = this.shouldIncludeDetails(responseObj, message) ? responseObj : undefined

      return { statusCode, message, code, details }
    }

    // 默认处理
    return {
      statusCode,
      message: httpException.message,
      code: getErrorCodeFromStatus(statusCode),
    }
  }

  /**
   * 从响应对象中提取消息
   */
  private extractMessageFromResponse(responseObj: Record<string, unknown>, fallbackMessage: string): string {
    // 优先使用message字段
    if (typeof responseObj.message === 'string') {
      return responseObj.message
    }

    // 处理消息数组（如验证错误）
    if (Array.isArray(responseObj.message)) {
      return responseObj.message.join('; ')
    }

    // 使用错误信息字段
    if (typeof responseObj.error === 'string') {
      return responseObj.error
    }

    return fallbackMessage
  }

  /**
   * 判断是否应该包含详细信息
   */
  private shouldIncludeDetails(responseObj: Record<string, unknown>, _extractedMessage: string): boolean {
    // 如果响应对象包含message以外的有用信息，则包含详情
    const hasAdditionalInfo = Object.keys(responseObj).some(key =>
      key !== 'message'
      && key !== 'statusCode'
      && responseObj[key] !== undefined,
    )

    // 如果消息被处理过（数组合并），包含原始详情
    const messageWasProcessed = Array.isArray(responseObj.message) && responseObj.message.length > 1

    return hasAdditionalInfo || messageWasProcessed
  }

  /**
   * 判断是否为客户端错误
   */
  isClientError(statusCode: number): boolean {
    return statusCode >= 400 && statusCode < 500
  }

  /**
   * 判断是否为服务器错误
   */
  isServerError(statusCode: number): boolean {
    return statusCode >= 500 && statusCode < 600
  }

  /**
   * 获取错误严重程度
   */
  getErrorSeverity(statusCode: number): 'low' | 'medium' | 'high' {
    if (statusCode < 500)
      return 'low'
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR)
      return 'high'
    return 'medium'
  }
}

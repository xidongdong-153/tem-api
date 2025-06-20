import type { BusinessExceptionStrategy, ExceptionContext, ExceptionHandleResult } from '../interfaces'

import { HttpStatus } from '@nestjs/common'

/**
 * 业务异常基类
 */
export class BusinessException extends Error {
  constructor(
    public readonly businessCode: string,
    message: string,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'BusinessException'
  }
}

/**
 * 业务异常处理策略
 * 专门处理自定义的业务异常
 */
export class BusinessExceptionStrategyImpl implements BusinessExceptionStrategy {
  readonly name = 'BusinessExceptionStrategy'
  readonly priority = 150

  /**
   * 判断是否可以处理该异常
   */
  canHandle(exception: unknown): boolean {
    return exception instanceof BusinessException
  }

  /**
   * 处理业务异常
   */
  handle(exception: unknown, _context: ExceptionContext): ExceptionHandleResult {
    if (!this.canHandle(exception)) {
      throw new Error('BusinessExceptionStrategy cannot handle this exception')
    }

    const businessException = exception as BusinessException

    return {
      statusCode: businessException.statusCode,
      message: businessException.message,
      code: businessException.businessCode,
      details: this.buildBusinessDetails(businessException),
    }
  }

  /**
   * 提取业务错误代码
   */
  extractBusinessCode(exception: unknown): string {
    if (exception instanceof BusinessException) {
      return exception.businessCode
    }
    return 'UNKNOWN_BUSINESS_ERROR'
  }

  /**
   * 提取业务上下文信息
   */
  extractBusinessContext(exception: unknown): Record<string, unknown> {
    if (exception instanceof BusinessException && exception.context) {
      return exception.context
    }
    return {}
  }

  /**
   * 生成错误建议
   */
  generateSuggestions(exception: unknown): string[] {
    if (!(exception instanceof BusinessException)) {
      return []
    }

    const suggestions: string[] = []
    const businessCode = exception.businessCode

    // 根据业务错误码提供相应建议
    switch (businessCode) {
      case 'USER_001': // 用户不存在
        suggestions.push('Please check if user ID is correct')
        suggestions.push('Confirm if user is registered')
        break
      case 'USER_002': // 用户已存在
        suggestions.push('Please use different username or email')
        suggestions.push('If forgot password, please use password recovery function')
        break
      case 'AUTH_001': // 令牌过期
        suggestions.push('Please log in again to get new access token')
        suggestions.push('Check if system time is correct')
        break
      case 'VAL_001': // 验证失败
        suggestions.push('Please check if input data format is correct')
        suggestions.push('Confirm all required fields are filled')
        break
      case 'BIZ_001': // 业务规则违反
        suggestions.push('Please check if operation complies with business rules')
        suggestions.push('Contact administrator for more information')
        break
      default:
        suggestions.push('Please contact technical support for help')
        break
    }

    return suggestions
  }

  /**
   * 构建业务异常详细信息
   */
  private buildBusinessDetails(exception: BusinessException): Record<string, unknown> {
    const details: Record<string, unknown> = {
      businessCode: exception.businessCode,
      suggestions: this.generateSuggestions(exception),
    }

    // 添加业务上下文
    const context = this.extractBusinessContext(exception)
    if (Object.keys(context).length > 0) {
      details.context = context
    }

    // 添加错误时间戳
    details.occurredAt = new Date().toISOString()

    return details
  }

  /**
   * 判断是否为关键业务错误
   */
  isCriticalBusinessError(businessCode: string): boolean {
    const criticalCodes = [
      'SYS_001', // 数据库错误
      'SYS_002', // 外部服务错误
      'AUTH_001', // 认证失败
    ]
    return criticalCodes.includes(businessCode)
  }
}

import type { ExceptionContext, ExceptionHandleResult, ValidationExceptionStrategy } from '../interfaces'

import { HttpStatus } from '@nestjs/common'

/**
 * 验证异常基类
 */
export class ValidationException extends Error {
  constructor(
    message: string,
    public readonly validationErrors: string[],
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message)
    this.name = 'ValidationException'
  }
}

/**
 * 验证异常处理策略
 * 专门处理数据验证相关的异常
 */
export class ValidationExceptionStrategyImpl implements ValidationExceptionStrategy {
  readonly name = 'ValidationExceptionStrategy'
  readonly priority = 120

  /**
   * 判断是否可以处理该异常
   */
  canHandle(exception: unknown): boolean {
    return exception instanceof ValidationException
      || this.isClassValidatorException(exception)
  }

  /**
   * 处理验证异常
   */
  handle(exception: unknown, _context: ExceptionContext): ExceptionHandleResult {
    if (!this.canHandle(exception)) {
      throw new Error('ValidationExceptionStrategy cannot handle this exception')
    }

    if (exception instanceof ValidationException) {
      return this.handleCustomValidationException(exception)
    }

    // 处理class-validator等第三方验证库的异常
    return this.handleThirdPartyValidationException(exception)
  }

  /**
   * 格式化验证错误消息
   */
  formatValidationErrors(exception: unknown): string[] {
    if (exception instanceof ValidationException) {
      return exception.validationErrors
    }

    // 处理class-validator异常
    if (this.isClassValidatorException(exception)) {
      return this.extractClassValidatorErrors(exception)
    }

    return ['Validation failed']
  }

  /**
   * 提取字段级别的错误
   */
  extractFieldErrors(exception: unknown): Record<string, string[]> {
    if (exception instanceof ValidationException) {
      return exception.fieldErrors
    }

    // 处理class-validator异常
    if (this.isClassValidatorException(exception)) {
      return this.extractClassValidatorFieldErrors(exception)
    }

    return {}
  }

  /**
   * 处理自定义验证异常
   */
  private handleCustomValidationException(exception: ValidationException): ExceptionHandleResult {
    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: exception.message,
      code: 'VALIDATION_ERROR',
      details: {
        validationErrors: exception.validationErrors,
        fieldErrors: exception.fieldErrors,
        errorCount: exception.validationErrors.length,
      },
    }
  }

  /**
   * 处理第三方验证异常
   */
  private handleThirdPartyValidationException(exception: unknown): ExceptionHandleResult {
    const validationErrors = this.formatValidationErrors(exception)
    const fieldErrors = this.extractFieldErrors(exception)

    return {
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      message: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      details: {
        validationErrors,
        fieldErrors,
        errorCount: validationErrors.length,
      },
    }
  }

  /**
   * 判断是否为class-validator异常
   */
  private isClassValidatorException(exception: unknown): boolean {
    // 检查是否包含class-validator的特征属性
    if (typeof exception === 'object' && exception !== null) {
      const ex = exception as Record<string, unknown>
      return Array.isArray(ex.message)
        || (typeof ex.message === 'object' && ex.message !== null)
        || 'constraints' in ex
        || 'validationErrors' in ex
    }
    return false
  }

  /**
   * 从class-validator异常中提取错误信息
   */
  private extractClassValidatorErrors(exception: unknown): string[] {
    const ex = exception as Record<string, unknown>

    // 处理消息数组
    if (Array.isArray(ex.message)) {
      return ex.message.filter((msg): msg is string => typeof msg === 'string')
    }

    // 处理嵌套的验证错误对象
    if (Array.isArray(ex.validationErrors)) {
      return this.flattenValidationErrors(ex.validationErrors)
    }

    // 处理单个错误对象
    if (typeof ex.message === 'object' && ex.message !== null) {
      const messageObj = ex.message as Record<string, unknown>
      if (Array.isArray(messageObj.message)) {
        return messageObj.message.filter((msg): msg is string => typeof msg === 'string')
      }
    }

    return ['Validation failed']
  }

  /**
   * 从class-validator异常中提取字段错误
   */
  private extractClassValidatorFieldErrors(exception: unknown): Record<string, string[]> {
    const ex = exception as Record<string, unknown>
    const fieldErrors: Record<string, string[]> = {}

    if (Array.isArray(ex.validationErrors)) {
      for (const error of ex.validationErrors) {
        if (typeof error === 'object' && error !== null) {
          const errorObj = error as Record<string, unknown>
          const property = errorObj.property as string
          const constraints = errorObj.constraints as Record<string, string>

          if (property && constraints !== null) {
            fieldErrors[property] = Object.values(constraints)
          }
        }
      }
    }

    return fieldErrors
  }

  /**
   * 扁平化验证错误
   */
  private flattenValidationErrors(validationErrors: unknown[]): string[] {
    const errors: string[] = []

    for (const error of validationErrors) {
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as Record<string, unknown>

        if (errorObj.constraints !== null && typeof errorObj.constraints === 'object') {
          const constraints = errorObj.constraints as Record<string, string>
          errors.push(...Object.values(constraints))
        }

        // 递归处理嵌套错误
        if (Array.isArray(errorObj.children) && errorObj.children.length > 0) {
          errors.push(...this.flattenValidationErrors(errorObj.children))
        }
      }
    }

    return errors
  }

  /**
   * 生成验证错误的用户友好消息
   */
  generateUserFriendlyMessage(errors: string[]): string {
    if (errors.length === 0) {
      return 'Data validation failed'
    }

    if (errors.length === 1) {
      return errors[0]
    }

    return `Data validation failed: ${errors.join('; ')}`
  }
}

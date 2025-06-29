import type { BusinessExceptionOptions } from '../interfaces'
import { HttpStatus } from '@nestjs/common'

/**
 * 业务异常类
 * 用于抛出自定义的业务逻辑错误
 */
export class BusinessException extends Error {
  public readonly code: string
  public readonly statusCode: HttpStatus
  public readonly details?: unknown

  constructor(
    message: string,
    code: string = 'BUSINESS_ERROR',
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(message)
    this.name = 'BusinessException'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  /**
   * 使用选项对象创建业务异常
   */
  static fromOptions(options: BusinessExceptionOptions): BusinessException {
    return new BusinessException(
      options.message,
      options.code,
      options.statusCode,
      options.details,
    )
  }

  /**
   * 创建用户相关异常
   */
  static userNotFound(userId?: string): BusinessException {
    return new BusinessException(
      'User not found',
      'USER_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      { userId },
    )
  }

  static userExists(identifier?: string): BusinessException {
    return new BusinessException(
      'User already exists',
      'USER_EXISTS',
      HttpStatus.CONFLICT,
      { identifier },
    )
  }

  /**
   * 创建认证相关异常
   */
  static tokenExpired(): BusinessException {
    return new BusinessException(
      'Token has expired',
      'TOKEN_EXPIRED',
      HttpStatus.UNAUTHORIZED,
    )
  }

  static tokenInvalid(): BusinessException {
    return new BusinessException(
      'Invalid token',
      'TOKEN_INVALID',
      HttpStatus.UNAUTHORIZED,
    )
  }

  /**
   * 创建权限相关异常
   */
  static permissionDenied(resource?: string): BusinessException {
    return new BusinessException(
      'Permission denied',
      'PERMISSION_DENIED',
      HttpStatus.FORBIDDEN,
      { resource },
    )
  }

  /**
   * 创建通用业务异常
   */
  static custom(message: string, code: string, statusCode?: HttpStatus, details?: unknown): BusinessException {
    return new BusinessException(message, code, statusCode, details)
  }
}

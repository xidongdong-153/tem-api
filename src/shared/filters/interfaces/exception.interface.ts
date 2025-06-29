import type { HttpStatus } from '@nestjs/common'

/**
 * 业务异常构造参数接口
 */
export interface BusinessExceptionOptions {
  message: string
  code?: string
  statusCode?: HttpStatus
  details?: unknown
}

/**
 * 日志上下文接口
 */
export interface LogContext {
  traceId: string
  method: string
  url: string
  clientIp: string
  userAgent: string
  statusCode: number
  errorCode: string
  errorMessage: string
}

/**
 * 错误详情上下文接口
 */
export interface ErrorDetailContext extends LogContext {
  errorName?: string
  errorStack?: string
}

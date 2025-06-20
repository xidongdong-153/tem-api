import { HttpStatus } from '@nestjs/common'

/**
 * HTTP状态码到错误代码的映射
 */
export const ERROR_CODE_MAPPING = {
  // 客户端错误 4xx
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.PAYMENT_REQUIRED]: 'PAYMENT_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.NOT_ACCEPTABLE]: 'NOT_ACCEPTABLE',
  [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: 'PROXY_AUTHENTICATION_REQUIRED',
  [HttpStatus.REQUEST_TIMEOUT]: 'REQUEST_TIMEOUT',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.GONE]: 'GONE',
  [HttpStatus.LENGTH_REQUIRED]: 'LENGTH_REQUIRED',
  [HttpStatus.PRECONDITION_FAILED]: 'PRECONDITION_FAILED',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.URI_TOO_LONG]: 'URI_TOO_LONG',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: 'REQUESTED_RANGE_NOT_SATISFIABLE',
  [HttpStatus.EXPECTATION_FAILED]: 'EXPECTATION_FAILED',
  [HttpStatus.I_AM_A_TEAPOT]: 'I_AM_A_TEAPOT',
  [HttpStatus.MISDIRECTED]: 'MISDIRECTED',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.FAILED_DEPENDENCY]: 'FAILED_DEPENDENCY',
  [HttpStatus.PRECONDITION_REQUIRED]: 'PRECONDITION_REQUIRED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',

  // 服务器错误 5xx
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
  [HttpStatus.NOT_IMPLEMENTED]: 'NOT_IMPLEMENTED',
  [HttpStatus.BAD_GATEWAY]: 'BAD_GATEWAY',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'GATEWAY_TIMEOUT',
  [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP_VERSION_NOT_SUPPORTED',
} as const

/**
 * 业务异常类型映射
 */
export const BUSINESS_EXCEPTION_MAPPING = {
  // 用户相关业务异常
  USER_NOT_FOUND: 'USER_001',
  USER_ALREADY_EXISTS: 'USER_002',
  INVALID_USER_CREDENTIALS: 'USER_003',
  USER_PERMISSION_DENIED: 'USER_004',
  USER_ACCOUNT_LOCKED: 'USER_005',

  // 认证相关业务异常
  TOKEN_EXPIRED: 'AUTH_001',
  TOKEN_INVALID: 'AUTH_002',
  TOKEN_MISSING: 'AUTH_003',

  // 验证相关业务异常
  VALIDATION_FAILED: 'VAL_001',
  REQUIRED_FIELD_MISSING: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',

  // 业务规则异常
  BUSINESS_RULE_VIOLATION: 'BIZ_001',
  OPERATION_NOT_ALLOWED: 'BIZ_002',
  RESOURCE_CONFLICT: 'BIZ_003',

  // 系统异常
  DATABASE_CONNECTION_ERROR: 'SYS_001',
  EXTERNAL_SERVICE_UNAVAILABLE: 'SYS_002',
  CONFIGURATION_ERROR: 'SYS_003',
} as const

/**
 * 异常严重级别映射
 */
export const EXCEPTION_SEVERITY_MAPPING = {
  // 低严重级别 - 客户端错误
  LOW: [
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
    HttpStatus.METHOD_NOT_ALLOWED,
    HttpStatus.CONFLICT,
    HttpStatus.UNPROCESSABLE_ENTITY,
    HttpStatus.TOO_MANY_REQUESTS,
  ],

  // 中等严重级别 - 服务配置问题
  MEDIUM: [
    HttpStatus.BAD_GATEWAY,
    HttpStatus.SERVICE_UNAVAILABLE,
    HttpStatus.GATEWAY_TIMEOUT,
    HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
  ],

  // 高严重级别 - 服务器内部错误
  HIGH: [
    HttpStatus.INTERNAL_SERVER_ERROR,
    HttpStatus.NOT_IMPLEMENTED,
  ],
} as const

/**
 * 获取错误代码的工具函数
 */
export function getErrorCodeFromStatus(statusCode: number): string {
  const errorCode = ERROR_CODE_MAPPING[statusCode as keyof typeof ERROR_CODE_MAPPING]
  return errorCode ?? `HTTP_${statusCode}`
}

/**
 * 获取异常严重级别的工具函数
 */
export function getExceptionSeverity(statusCode: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' {
  for (const [severity, codes] of Object.entries(EXCEPTION_SEVERITY_MAPPING)) {
    if (codes.includes(statusCode as never)) {
      return severity as 'LOW' | 'MEDIUM' | 'HIGH'
    }
  }
  return 'UNKNOWN'
}

/**
 * 判断是否为客户端错误
 */
export function isClientError(statusCode: number): boolean {
  return statusCode >= 400 && statusCode < 500
}

/**
 * 判断是否为服务器错误
 */
export function isServerError(statusCode: number): boolean {
  return statusCode >= 500 && statusCode < 600
}

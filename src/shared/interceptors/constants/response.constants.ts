/**
 * 响应相关常量
 * 包含响应拦截器、装饰器等使用的常量定义
 */

/**
 * 响应选项元数据键
 * 用于在控制器方法上存储响应配置选项
 */
export const RESPONSE_OPTIONS_KEY = 'response:options'

/**
 * 响应模式常量
 */
export const RESPONSE_MODES = {
  /** 标准响应模式 */
  STANDARD: 'standard',
  /** 分页响应模式 */
  PAGINATION: 'pagination',
  /** 原始响应模式 */
  RAW: 'raw',
} as const

/**
 * 响应模式类型
 */
export type ResponseMode = typeof RESPONSE_MODES[keyof typeof RESPONSE_MODES]

/**
 * HTTP 方法常量
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const

/**
 * HTTP 方法类型
 */
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS]

/**
 * 响应状态常量
 */
export const RESPONSE_STATUS = {
  SUCCESS: true,
  FAILURE: false,
} as const

/**
 * 默认响应消息
 */
export const DEFAULT_RESPONSE_MESSAGES = {
  SUCCESS: 'Operation successful',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  RETRIEVED: 'Retrieved successfully',
  PAGINATED: 'Paginated query successful',
} as const

/**
 * 日志相关常量
 */
export const LOG_CONSTANTS = {
  REQUEST_START: 'HTTP Request',
  RESPONSE_SUCCESS: 'HTTP Response',
  RESPONSE_ERROR: 'HTTP Response Error',
  UNKNOWN_IP: 'unknown',
} as const

/**
 * 请求头常量
 */
export const HEADER_KEYS = {
  USER_AGENT: 'user-agent',
  X_FORWARDED_FOR: 'x-forwarded-for',
  X_REAL_IP: 'x-real-ip',
  AUTHORIZATION: 'authorization',
  CONTENT_TYPE: 'content-type',
} as const

/**
 * 序列化策略常量
 */
export const SERIALIZATION_STRATEGY = {
  STANDARD: 'standard', // 标准序列化
  PAGINATION: 'pagination', // 分页序列化
  RAW: 'raw', // 不进行序列化
} as const

/**
 * 序列化元数据键常量
 */
export const SERIALIZATION_METADATA_KEY = {
  RESPONSE_OPTIONS: 'serialization:response-options', // 响应选项
  EXCLUDE_FIELDS: 'serialization:exclude-fields', // 排除字段
} as const

/**
 * 默认配置常量
 */
export const DEFAULT_SERIALIZATION_CONFIG = {
  STRATEGY: SERIALIZATION_STRATEGY.STANDARD, // 序列化策略
  EXCLUDE_FIELDS: ['password', 'token', 'secret'], // 排除字段
  DATE_FORMAT: 'ISO8601', // 日期格式
  TIMEZONE: 'UTC', // 时区
  ENABLED: true, // 是否启用
} as const

/**
 * HTTP 方法常量
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const

/**
 * 响应状态常量
 */
export const RESPONSE_STATUS = {
  SUCCESS: true,
  ERROR: false,
} as const

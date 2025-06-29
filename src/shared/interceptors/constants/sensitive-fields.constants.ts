/**
 * 敏感字段常量
 * 这些字段在响应中会被自动过滤，防止敏感信息泄露
 */

/**
 * 默认敏感字段列表
 * 这些字段会在所有响应中被自动排除
 */
export const DEFAULT_SENSITIVE_FIELDS = [
  'passwordHash',
  'password',
  'isDeleted',
  'lastLoginIp',
  'lastLoginAt',
  'email',
  'phone',
] as const

/**
 * 系统级敏感字段
 * 包含系统内部使用的敏感信息
 */
export const SYSTEM_SENSITIVE_FIELDS = [
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'privateKey',
  'accessToken',
] as const

/**
 * 用户隐私字段
 * 包含用户个人隐私相关的字段
 */
export const PRIVACY_SENSITIVE_FIELDS = [
  'idCard',
  'bankCard',
  'socialSecurityNumber',
  'taxId',
  'passport',
] as const

/**
 * 审计字段
 * 包含系统审计和内部追踪相关的字段
 */
export const AUDIT_SENSITIVE_FIELDS = [
  'deletedAt',
  'deletedBy',
  'internalNotes',
  'adminNotes',
  'debugInfo',
] as const

/**
 * 所有敏感字段的联合类型
 */
export type SensitiveField
  = | typeof DEFAULT_SENSITIVE_FIELDS[number]
    | typeof SYSTEM_SENSITIVE_FIELDS[number]
    | typeof PRIVACY_SENSITIVE_FIELDS[number]
    | typeof AUDIT_SENSITIVE_FIELDS[number]

/**
 * 合并所有敏感字段
 */
export const ALL_SENSITIVE_FIELDS = [
  ...DEFAULT_SENSITIVE_FIELDS,
  ...SYSTEM_SENSITIVE_FIELDS,
  ...PRIVACY_SENSITIVE_FIELDS,
  ...AUDIT_SENSITIVE_FIELDS,
] as const

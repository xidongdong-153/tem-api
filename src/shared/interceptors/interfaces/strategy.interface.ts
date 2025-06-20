import type {
  PaginatedApiResponse,
  PaginationMeta,
  SerializationContext,
  StandardApiResponse,
} from './serialization.interface'

/**
 * 标准响应策略接口
 */
export interface IStandardResponseStrategy {
  readonly name: 'standard'
  // 支持数据类型
  supports: (data: unknown) => boolean
  // 序列化
  serialize: <T>(data: T, context: SerializationContext) => StandardApiResponse<T>
}

/**
 * 分页响应策略接口
 */
export interface IPaginationResponseStrategy {
  readonly name: 'pagination'
  // 支持数据类型
  supports: (data: unknown) => boolean
  // 序列化
  serialize: <T>(data: T[], meta: PaginationMeta, context: SerializationContext) => PaginatedApiResponse<T>
}

/**
 * 原始响应策略接口
 */
export interface IRawResponseStrategy {
  readonly name: 'raw'
  // 支持数据类型
  supports: (data: unknown) => boolean
  // 序列化
  serialize: <T>(data: T, context: SerializationContext) => T
}

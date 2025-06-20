import type {
  IPaginationResponseStrategy,
  PaginatedApiResponse,
  PaginatedResult,
  PaginationMeta,
  SerializationContext,
} from '../interfaces'

import { Injectable } from '@nestjs/common'
import { RESPONSE_STATUS, SERIALIZATION_STRATEGY } from '../constants'

/**
 * 分页响应格式策略实现
 */
@Injectable()
export class PaginationResponseStrategy implements IPaginationResponseStrategy {
  readonly name = SERIALIZATION_STRATEGY.PAGINATION

  /**
   * 检查是否支持当前数据类型
   */
  supports(data: unknown): boolean {
    return this.isPaginatedData(data)
  }

  /**
   * 序列化数据为分页响应格式
   */
  serialize<T>(
    data: T[],
    meta: PaginationMeta,
    context: SerializationContext,
  ): PaginatedApiResponse<T> {
    return {
      success: RESPONSE_STATUS.SUCCESS,
      data,
      pagination: {
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        totalPages: meta.totalPages,
      },
      timestamp: context.timestamp,
      path: context.request.path,
      method: context.request.method,
      statusCode: context.response.statusCode,
    }
  }

  /**
   * 从分页结果中序列化数据
   */
  serializeFromPaginatedResult<T>(
    paginatedResult: PaginatedResult<T>,
    context: SerializationContext,
  ): PaginatedApiResponse<T> {
    return this.serialize(paginatedResult.data, paginatedResult.meta, context)
  }

  /**
   * 检查数据是否为分页数据
   */
  private isPaginatedData(data: unknown): boolean {
    return Boolean(
      data !== null
      && typeof data === 'object'
      && 'data' in data
      && 'meta' in data
      && Array.isArray((data as PaginatedResult<unknown>).data)
      && this.isValidPaginationMeta((data as PaginatedResult<unknown>).meta),
    )
  }

  /**
   * 验证分页元数据是否有效
   */
  private isValidPaginationMeta(meta: unknown): boolean {
    return Boolean(
      meta !== null
      && typeof meta === 'object'
      && 'page' in meta
      && 'limit' in meta
      && 'total' in meta
      && 'totalPages' in meta
      && typeof (meta as PaginationMeta).page === 'number'
      && typeof (meta as PaginationMeta).limit === 'number'
      && typeof (meta as PaginationMeta).total === 'number'
      && typeof (meta as PaginationMeta).totalPages === 'number',
    )
  }
}

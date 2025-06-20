import type {
  IStandardResponseStrategy,
  SerializationContext,
  StandardApiResponse,
} from '../interfaces'

import { Injectable } from '@nestjs/common'
import { RESPONSE_STATUS, SERIALIZATION_STRATEGY } from '../constants'

/**
 * 标准响应格式策略实现
 */
@Injectable()
export class StandardResponseStrategy implements IStandardResponseStrategy {
  readonly name = SERIALIZATION_STRATEGY.STANDARD

  /**
   * 检查是否支持当前数据类型
   */
  supports(data: unknown): boolean {
    // 标准策略支持所有非分页数据
    return !this.isPaginatedData(data)
  }

  /**
   * 序列化数据为标准响应格式
   */
  serialize<T>(data: T, context: SerializationContext): StandardApiResponse<T> {
    return {
      success: RESPONSE_STATUS.SUCCESS,
      data,
      message: context.options?.message,
      timestamp: context.timestamp,
      path: context.request.path,
      method: context.request.method,
      statusCode: context.response.statusCode,
    }
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
      && Array.isArray((data as { data: unknown }).data),
    )
  }
}

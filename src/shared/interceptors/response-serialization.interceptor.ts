import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import type {
  PaginatedApiResponse,
  PaginatedResult,
  SerializationContext,
  SerializeResponseOptions,
  StandardApiResponse,
} from './interfaces'
import { Injectable } from '@nestjs/common'

import { Reflector } from '@nestjs/core'
import { map } from 'rxjs/operators'
import { DEFAULT_SERIALIZATION_CONFIG, SERIALIZATION_METADATA_KEY, SERIALIZATION_STRATEGY } from './constants'
import { PaginationResponseStrategy, StandardResponseStrategy } from './strategies'

// 定义 Fastify 请求和响应的基本接口
interface FastifyRequest {
  method: string
  url: string
  routerPath?: string
}

interface FastifyReply {
  statusCode: number
}

/**
 * 响应序列化拦截器
 * 负责统一序列化 API 响应格式
 */
@Injectable()
export class ResponseSerializationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly standardStrategy: StandardResponseStrategy,
    private readonly paginationStrategy: PaginationResponseStrategy,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => this.serializeResponse(data, context)),
    )
  }

  /**
   * 序列化响应数据
   */
  private serializeResponse<T>(data: T, context: ExecutionContext): StandardApiResponse<T> | PaginatedApiResponse<T> | T {
    try {
      // 获取响应序列化选项
      const options = this.getSerializationOptions(context)

      // 如果策略为 raw，直接返回原始数据
      if (options.strategy === SERIALIZATION_STRATEGY.RAW) {
        return data
      }

      // 创建序列化上下文
      const serializationContext = this.createSerializationContext(context, options)

      // 检查是否为分页数据
      if (options.strategy === SERIALIZATION_STRATEGY.PAGINATION || this.paginationStrategy.supports(data)) {
        return this.serializePaginatedResponse(data as PaginatedResult<T>, serializationContext, options)
      }

      // 应用字段过滤
      const filteredData = this.applyFieldFiltering(data, options)

      // 使用标准策略序列化
      return this.standardStrategy.serialize(filteredData, serializationContext)
    }
    catch (error) {
      // 序列化出错时返回原始数据
      console.error('Response serialization error:', error)
      return data
    }
  }

  /**
   * 序列化分页响应
   */
  private serializePaginatedResponse<T>(
    paginatedResult: PaginatedResult<T>,
    context: SerializationContext,
    options: SerializeResponseOptions,
  ): PaginatedApiResponse<T> {
    // 应用字段过滤到分页数据
    const filteredData = this.applyFieldFiltering(paginatedResult.data, options)

    const filteredPaginatedResult: PaginatedResult<T> = {
      data: filteredData,
      meta: paginatedResult.meta,
    }

    return this.paginationStrategy.serializeFromPaginatedResult(filteredPaginatedResult, context)
  }

  /**
   * 获取序列化选项
   */
  private getSerializationOptions(context: ExecutionContext): SerializeResponseOptions {
    const methodOptions = this.getMethodOptions(context)
    const excludeFields = this.getExcludeFields(context)

    return this.mergeSerializationOptions(methodOptions, excludeFields)
  }

  /**
   * 获取方法级别的序列化选项
   */
  private getMethodOptions(context: ExecutionContext): SerializeResponseOptions | undefined {
    return this.reflector.get<SerializeResponseOptions>(
      SERIALIZATION_METADATA_KEY.RESPONSE_OPTIONS,
      context.getHandler(),
    )
  }

  /**
   * 获取排除字段
   */
  private getExcludeFields(context: ExecutionContext): string[] {
    return this.reflector.get<string[]>(
      SERIALIZATION_METADATA_KEY.EXCLUDE_FIELDS,
      context.getHandler(),
    ) ?? []
  }

  /**
   * 合并序列化选项
   */
  private mergeSerializationOptions(
    methodOptions: SerializeResponseOptions | undefined,
    excludeFields: string[],
  ): SerializeResponseOptions {
    return {
      strategy: methodOptions?.strategy ?? DEFAULT_SERIALIZATION_CONFIG.STRATEGY,
      exclude: [
        ...(methodOptions?.exclude ?? []),
        ...excludeFields,
        ...DEFAULT_SERIALIZATION_CONFIG.EXCLUDE_FIELDS,
      ],
      include: methodOptions?.include,
      message: methodOptions?.message,
    }
  }

  /**
   * 创建序列化上下文
   */
  private createSerializationContext(
    context: ExecutionContext,
    options: SerializeResponseOptions,
  ): SerializationContext {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()

    return {
      request: {
        method: request.method,
        path: request.routerPath ?? request.url,
        url: request.url,
      },
      response: {
        statusCode: response.statusCode,
      },
      timestamp: new Date().toISOString(),
      options,
    }
  }

  /**
   * 应用字段过滤
   */
  private applyFieldFiltering<T>(data: T, options: SerializeResponseOptions): T {
    if (data === null || data === undefined || typeof data !== 'object') {
      return data
    }

    if (Array.isArray(data)) {
      return this.filterArrayData(data, options)
    }

    return this.filterObjectData(data, options)
  }

  /**
   * 过滤数组数据
   */
  private filterArrayData<T>(data: unknown[], options: SerializeResponseOptions): T {
    const filteredArray = data.map(item => this.applyFieldFiltering(item, options))
    return filteredArray as T
  }

  /**
   * 过滤对象数据
   */
  private filterObjectData<T>(data: T, options: SerializeResponseOptions): T {
    const excludeFields = options.exclude ?? []
    const includeFields = options.include

    if (excludeFields.length === 0 && !includeFields) {
      return data
    }

    const result = this.excludeFields({ ...data } as Record<string, unknown>, excludeFields)

    if (includeFields && includeFields.length > 0) {
      return this.includeFields(result, includeFields) as T
    }

    return result as T
  }

  /**
   * 排除指定字段
   */
  private excludeFields(data: Record<string, unknown>, excludeFields: string[]): Record<string, unknown> {
    for (const field of excludeFields) {
      if (field in data) {
        delete data[field]
      }
    }
    return data
  }

  /**
   * 只包含指定字段
   */
  private includeFields(data: Record<string, unknown>, includeFields: string[]): Record<string, unknown> {
    const filteredResult: Record<string, unknown> = {}
    for (const field of includeFields) {
      if (field in data) {
        filteredResult[field] = data[field]
      }
    }
    return filteredResult
  }
}

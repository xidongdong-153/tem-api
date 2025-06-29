import type { Collection } from '@mikro-orm/core'
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import type {
  ApiResponse,
  FastifyReply,
  FastifyRequest,
  PaginatedResponse,
  PaginatedResult,
  ResponseOptions,
} from './interfaces/response.interface'
import { Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { instanceToPlain } from 'class-transformer'
import { map, tap } from 'rxjs/operators'
import { LoggerService } from '../../modules/logger'
import {
  DEFAULT_SENSITIVE_FIELDS,
  HEADER_KEYS,
  LOG_CONSTANTS,
  RESPONSE_OPTIONS_KEY,
  RESPONSE_STATUS,
} from './constants'

/**
 * 响应拦截器
 *
 * 主要功能：
 * - 统一响应格式处理
 * - 敏感字段过滤
 * - 分页数据处理
 * - 请求/响应日志记录
 * - MikroORM 实体序列化
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  // ================================
  // 核心拦截器方法
  // ================================

  /**
   * 拦截请求，处理响应数据转换和日志记录
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()
    const startTime = Date.now()

    // 记录请求开始
    this.logRequest(request)

    return next.handle().pipe(
      tap({
        next: () => this.logResponse(request, response, startTime, true),
        error: (error: Error) => this.logResponse(request, response, startTime, false, error),
      }),
      map((data: unknown) => this.transformResponse(data, context)),
    )
  }

  /**
   * 根据数据类型和配置转换响应数据
   */
  private transformResponse(data: unknown, context: ExecutionContext): unknown {
    const options = this.getResponseOptions(context)

    // 原始响应模式，直接返回数据
    if (options.raw) {
      return data
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()

    // 检查是否为分页数据并进行相应处理
    if (this.isPaginatedData(data)) {
      return this.transformPaginatedResponse(data as PaginatedResult, request, response, options, context)
    }

    // 标准响应格式处理
    return this.transformStandardResponse(data, request, response, options, context)
  }

  // ================================
  // 响应转换相关方法
  // ================================

  /**
   * 转换为标准API响应格式
   */
  private transformStandardResponse(
    data: unknown,
    request: FastifyRequest,
    response: FastifyReply,
    options: ResponseOptions,
    context: ExecutionContext,
  ): ApiResponse {
    const filteredData = this.filterSensitiveFields(data, options.exclude, context)

    return {
      success: RESPONSE_STATUS.SUCCESS,
      data: filteredData,
      message: options.message,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 转换为分页响应格式
   */
  private transformPaginatedResponse(
    paginatedData: PaginatedResult,
    request: FastifyRequest,
    response: FastifyReply,
    options: ResponseOptions,
    context: ExecutionContext,
  ): PaginatedResponse {
    const filteredData = this.filterSensitiveFields(paginatedData.data, options.exclude, context) as unknown[]

    return {
      success: RESPONSE_STATUS.SUCCESS,
      data: filteredData,
      meta: {
        page: paginatedData.meta.page,
        limit: paginatedData.meta.limit,
        total: paginatedData.meta.total,
        totalPages: paginatedData.meta.totalPages,
      },
      message: options.message,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * 从装饰器元数据中获取响应配置选项
   */
  private getResponseOptions(context: ExecutionContext): ResponseOptions {
    return this.reflector.get<ResponseOptions>(RESPONSE_OPTIONS_KEY, context.getHandler()) || {}
  }

  // ================================
  // 数据过滤和序列化方法
  // ================================

  /**
   * 递归过滤敏感字段，支持数组和对象
   */
  private filterSensitiveFields(data: unknown, excludeFields: string[] = [], context?: ExecutionContext): unknown {
    if (data === null || data === undefined) {
      return data
    }

    const allExcludeFields = [...DEFAULT_SENSITIVE_FIELDS, ...excludeFields]

    // 处理数组类型
    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveFields(item, excludeFields, context))
    }

    // 处理对象类型
    if (typeof data === 'object') {
      return this.filterObjectFields(data, allExcludeFields, context)
    }

    return data
  }

  /**
   * 过滤对象字段，优先使用 class-transformer 处理
   */
  private filterObjectFields(obj: object, excludeFields: string[], context?: ExecutionContext): unknown {
    // 特殊处理 MikroORM Collection
    if (this.isCollection(obj)) {
      const items = obj.getItems()
      return items.map(item => this.filterSensitiveFields(item, excludeFields, context))
    }

    // 优先使用 class-transformer 处理装饰器
    try {
      const groups = context ? this.getResponseOptions(context).groups || [] : []
      const plainObject = instanceToPlain(obj, {
        enableCircularCheck: true, // 启用循环引用检测
        exposeDefaultValues: true, // 暴露默认值
        exposeUnsetFields: false, // 不暴露未设置的字段
        groups, // 使用序列化组
      })

      if (typeof plainObject !== 'object' || plainObject === null) {
        return plainObject
      }

      const result: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(plainObject)) {
        if (!excludeFields.includes(key)) {
          // 特殊处理Date对象被序列化为空对象的情况
          if (value && typeof value === 'object' && Object.keys(value).length === 0) {
            const originalValue = (obj as Record<string, unknown>)[key]
            if (originalValue instanceof Date) {
              result[key] = originalValue.toISOString()
              continue
            }
          }
          result[key] = this.filterSensitiveFields(value, excludeFields, context)
        }
      }

      return result
    }
    catch {
      // class-transformer 处理失败时回退到手动序列化
      return this.serializeEntity(obj, excludeFields, context)
    }
  }

  /**
   * 手动序列化实体，避免循环引用，支持关联策略
   */
  private serializeEntity(entity: object, excludeFields: string[], context?: ExecutionContext): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const options = context ? this.getResponseOptions(context) : {}
    const relationStrategy = options.relations || 'basic' // 默认基础关联策略

    for (const [key, value] of Object.entries(entity)) {
      // 跳过私有属性和排除的字段
      if (key.startsWith('_') || key.startsWith('$') || excludeFields.includes(key)) {
        continue
      }

      // 处理 Collection 类型的关联
      if (this.isCollection(value)) {
        const serializedCollection = this.handleCollectionSerialization(value, relationStrategy, excludeFields, context)
        if (serializedCollection !== undefined) {
          result[key] = serializedCollection
        }
        continue
      }

      // 处理单个关联实体
      if (this.isMikroOrmEntity(value)) {
        const serializedEntity = this.handleEntitySerialization(value, relationStrategy, excludeFields, context)
        if (serializedEntity !== undefined) {
          result[key] = serializedEntity
        }
        continue
      }

      // 处理基本类型值
      if (this.isPrimitiveValue(value)) {
        result[key] = value
      }
    }

    return result
  }

  /**
   * 处理 Collection 序列化，支持多种策略
   */
  private handleCollectionSerialization(
    collection: Collection<object>,
    strategy: string,
    excludeFields: string[],
    context?: ExecutionContext,
  ): unknown {
    switch (strategy) {
      case 'none':
        return undefined // 不序列化关联

      case 'count':
        return { count: this.getCollectionCount(collection) }

      case 'basic':
        // 已初始化则序列化基本字段，否则显示数量
        if (collection.isInitialized()) {
          const items = collection.getItems()
          return items.length > 0
            ? items.map(item => this.serializeEntityBasicFields(item, excludeFields))
            : []
        }
        return { count: this.getCollectionCount(collection) }

      case 'full':
        // 完整序列化（需谨慎使用）
        if (collection.isInitialized()) {
          const items = collection.getItems()
          return items.map(item => this.filterSensitiveFields(item, excludeFields, context))
        }
        return { count: this.getCollectionCount(collection) }

      default:
        return { count: this.getCollectionCount(collection) }
    }
  }

  /**
   * 处理单个实体序列化，支持多种策略
   */
  private handleEntitySerialization(
    entity: object,
    strategy: string,
    excludeFields: string[],
    context?: ExecutionContext,
  ): unknown {
    switch (strategy) {
      case 'none':
        return undefined // 不序列化关联

      case 'count':
        // 对于单个实体，返回标识字段
        return this.serializeEntityIdentifier(entity, excludeFields)

      case 'basic':
        // 序列化基本字段
        return this.serializeEntityBasicFields(entity, excludeFields)

      case 'full':
        // 完整序列化（需谨慎使用）
        return this.filterSensitiveFields(entity, excludeFields, context)

      default:
        return this.serializeEntityBasicFields(entity, excludeFields)
    }
  }

  /**
   * 序列化实体的关键标识字段
   */
  private serializeEntityIdentifier(entity: object, excludeFields: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    // 按优先级查找标识字段
    const identifierFields = ['id', 'code', 'slug', 'username', 'name']

    for (const field of identifierFields) {
      if (field in entity && !excludeFields.includes(field)) {
        const value = (entity as Record<string, unknown>)[field]
        if (this.isPrimitiveValue(value)) {
          result[field] = value
          break // 只返回第一个找到的标识字段
        }
      }
    }

    return result
  }

  /**
   * 序列化实体的基本字段（不包含关联）
   */
  private serializeEntityBasicFields(entity: object, excludeFields: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    // 优先包含的关键字段
    const keyFields = ['id', 'title', 'name', 'username', 'nickname', 'email', 'slug', 'code', 'status']

    for (const [key, value] of Object.entries(entity)) {
      if (key.startsWith('_') || key.startsWith('$') || excludeFields.includes(key)) {
        continue
      }

      // 优先包含关键字段
      if (keyFields.includes(key) && this.isPrimitiveValue(value)) {
        result[key] = value
        continue
      }

      // 包含其他基本类型字段，排除关联
      if (this.isPrimitiveValue(value) && !this.isCollection(value) && !this.isMikroOrmEntity(value)) {
        result[key] = value
      }
    }

    return result
  }

  // ================================
  // 工具和辅助方法
  // ================================

  /**
   * 检查数据是否为分页结构
   */
  private isPaginatedData(data: unknown): boolean {
    return (
      data !== null
      && typeof data === 'object'
      && 'data' in data
      && 'meta' in data
      && Array.isArray((data as PaginatedResult).data)
      && this.isValidPaginationMeta((data as PaginatedResult).meta)
    )
  }

  /**
   * 验证分页元数据的完整性
   */
  private isValidPaginationMeta(meta: unknown): boolean {
    if (meta === null || typeof meta !== 'object') {
      return false
    }

    const requiredFields = ['page', 'limit', 'total', 'totalPages']
    return requiredFields.every(field =>
      field in meta && typeof (meta as Record<string, unknown>)[field] === 'number',
    )
  }

  /**
   * 判断是否为 MikroORM 实体
   */
  private isMikroOrmEntity(value: unknown): value is object {
    return value instanceof Object
      && ('id' in value || 'createdAt' in value || 'updatedAt' in value)
      && !Array.isArray(value)
  }

  /**
   * 判断是否为 MikroORM Collection
   */
  private isCollection(value: unknown): value is Collection<object> {
    return value instanceof Object && 'getItems' in value && typeof value.getItems === 'function'
  }

  /**
   * 判断是否为基本类型值
   */
  private isPrimitiveValue(value: unknown): boolean {
    return value === null
      || value === undefined
      || typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean'
      || value instanceof Date
  }

  /**
   * 安全地获取 Collection 的数量
   */
  private getCollectionCount(collection: Collection<object>): number {
    try {
      // 已初始化的集合返回实际长度，否则返回 -1 表示未知
      return collection.isInitialized() ? collection.length : -1
    }
    catch {
      return -1 // 出错时返回 -1
    }
  }

  // ================================
  // 日志记录方法
  // ================================

  /**
   * 记录请求开始信息
   */
  private logRequest(request: FastifyRequest): void {
    this.logger.info(LOG_CONSTANTS.REQUEST_START, {
      method: request.method,
      url: request.url,
      userAgent: this.getHeader(request.headers, HEADER_KEYS.USER_AGENT),
      ip: this.getClientIp(request),
    })
  }

  /**
   * 记录请求完成信息，包括成功和失败情况
   */
  private logResponse(
    request: FastifyRequest,
    response: FastifyReply,
    startTime: number,
    success: boolean,
    error?: Error,
  ): void {
    const duration = Date.now() - startTime
    const baseLogData = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      ip: this.getClientIp(request),
      success,
    }

    if (error) {
      this.logger.error(LOG_CONSTANTS.RESPONSE_ERROR, {
        ...baseLogData,
        error: error.message,
      })
    }
    else {
      this.logger.info(LOG_CONSTANTS.RESPONSE_SUCCESS, baseLogData)
    }
  }

  /**
   * 安全地获取请求头值
   */
  private getHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name.toLowerCase()]
    if (typeof value === 'string')
      return value
    if (Array.isArray(value))
      return value[0] || ''
    return ''
  }

  /**
   * 获取客户端真实IP地址
   */
  private getClientIp(request: FastifyRequest): string {
    // 优先从代理头中获取真实IP
    const xForwardedFor = this.getHeader(request.headers, HEADER_KEYS.X_FORWARDED_FOR)
    const xRealIp = this.getHeader(request.headers, HEADER_KEYS.X_REAL_IP)

    return xForwardedFor || xRealIp || request.ip || LOG_CONSTANTS.UNKNOWN_IP
  }
}

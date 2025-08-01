/**
 * API 数据转换拦截器相关接口定义
 */

/**
 * 基础响应接口
 */
export interface ApiResponse<T = unknown> {
  // 是否成功
  success: boolean
  // 数据
  data: T
  // 消息
  message?: string
  // 时间戳
  timestamp: string
}

/**
 * 分页元数据
 */
export interface PaginationMeta {
  // 当前页
  page: number
  // 每页条数
  limit: number
  // 总条数
  total: number
  // 总页数
  totalPages: number
}

/**
 * 分页响应接口（统一使用 meta 结构）
 */
export interface PaginatedResponse<T = unknown> {
  // 是否成功
  success: boolean
  // 数据
  data: T[]
  // 元数据（统一命名）
  meta: PaginationMeta
  // 消息
  message?: string
  // 时间戳
  timestamp: string
}

/**
 * 分页结果（来自服务层）
 */
export interface PaginatedResult<T = unknown> {
  data: T[]
  meta: PaginationMeta
}

/**
 * 关联数据显示策略
 */
export type RelationDisplayStrategy = 'none' | 'basic'

/**
 * API 转换装饰器选项
 */
export interface ResponseOptions {
  // 消息
  message?: string
  // 排除字段
  exclude?: string[]
  // 是否返回原始数据
  raw?: boolean
  // 序列化分组
  groups?: string[]
  // 关联数据显示策略
  relationStrategy?: RelationDisplayStrategy
}

/**
 * Fastify 请求响应接口
 */
export interface FastifyRequest {
  // 方法
  method: string
  // 路径
  url: string
  // 请求头
  headers: Record<string, string | string[] | undefined>
  // 请求体
  body?: unknown
  // 查询参数
  query?: Record<string, unknown>
  // 路径参数
  params?: Record<string, unknown>
  // 客户端IP
  ip?: string
  // 路由路径
  routerPath?: string
}

/**
 * Fastify 响应接口
 */
export interface FastifyReply {
  statusCode: number
}

/**
 * 错误响应接口（统一结构）
 */
export interface ErrorApiResponse {
  // 是否成功
  success: false
  // 错误信息
  error: {
    // 错误码
    code: string
    // 错误消息
    message: string
    // 错误详情
    details?: unknown
  }
  // 时间戳
  timestamp: string
  // 追踪ID（可选）
  traceId?: string
}

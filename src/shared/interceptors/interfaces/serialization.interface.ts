/**
 * 序列化上下文接口
 */
export interface SerializationContext {
  // 请求
  request: {
    // 方法
    method: string
    path: string
    url: string
  }
  // 响应
  response: {
    // 状态码
    statusCode: number
  }
  // 时间戳
  timestamp: string
  options?: SerializeResponseOptions
}

/**
 * 序列化响应选项接口
 */
export interface SerializeResponseOptions {
  // 策略
  strategy?: 'standard' | 'pagination' | 'raw'
  // 排除字段
  exclude?: string[]
  // 包含字段
  include?: string[]
  // 消息
  message?: string
}

/**
 * 标准 API 响应接口
 */
export interface StandardApiResponse<T> {
  // 是否成功
  success: boolean
  // 数据
  data: T
  // 消息
  message?: string
  // 时间戳
  timestamp: string
  // 路径
  path: string
  // 方法
  method: string
  // 状态码
  statusCode: number
}

/**
 * 分页元数据接口
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
 * 分页 API 响应接口
 */
export interface PaginatedApiResponse<T> {
  // 是否成功
  success: boolean
  // 数据
  data: T[]
  // 分页元数据
  pagination: PaginationMeta
  // 时间戳
  timestamp: string
  // 路径
  path: string
  // 方法
  method: string
  // 状态码
  statusCode: number
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * 错误 API 响应接口
 */
export interface ErrorApiResponse {
  // 是否成功
  success: false
  // 错误
  error: {
    // 错误码
    code: string
    // 错误消息
    message: string
    // 错误详情
    details?: unknown
    // 时间戳
    timestamp: string
    // 路径
    path: string
    // 方法
    method: string
    // 状态码
    statusCode: number
    // 追踪ID
    traceId?: string
  }
}

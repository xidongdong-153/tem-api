/**
 * 异常处理上下文接口
 * 包含处理异常时需要的所有上下文信息
 */
export interface ExceptionContext {
  /** 请求对象 */
  request: {
    // 方法
    method: string
    // 路径
    url: string
    // IP
    ip?: string
    // 头部
    headers: Record<string, string | string[] | undefined>
  }
  /** 响应对象 */
  response: {
    // 状态码
    status: (code: number) => unknown
    // 发送
    send: (payload: unknown) => unknown
  }
  /** 请求跟踪ID */
  traceId: string
  /** 请求时间戳 */
  timestamp: string
}

/**
 * 异常处理结果接口
 */
export interface ExceptionHandleResult {
  /** HTTP状态码 */
  statusCode: number
  /** 错误消息 */
  message: string
  /** 错误代码 */
  code: string
  /** 详细信息（可选） */
  details?: unknown
}

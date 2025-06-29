/**
 * 异常处理结果接口
 */
export interface ExceptionHandleResult {
  statusCode: number
  message: string
  code: string
  details?: unknown
}

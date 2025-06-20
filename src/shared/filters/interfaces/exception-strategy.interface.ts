import type { ExceptionContext, ExceptionHandleResult } from './exception-context.interface'

/**
 * 异常处理策略接口
 * 定义异常处理策略的标准接口
 */
export interface ExceptionStrategy {
  /**
   * 策略名称
   */
  readonly name: string

  /**
   * 策略优先级（数值越大优先级越高）
   */
  readonly priority: number

  /**
   * 判断是否可以处理该异常
   * @param exception 异常对象
   * @param context 异常上下文
   * @returns 是否可以处理
   */
  canHandle: (exception: unknown, context: ExceptionContext) => boolean

  /**
   * 处理异常
   * @param exception 异常对象
   * @param context 异常上下文
   * @returns 异常处理结果
   */
  handle: (exception: unknown, context: ExceptionContext) => ExceptionHandleResult
}

/**
 * HTTP异常策略接口
 * 专门处理HTTP异常的策略接口
 */
export interface HttpExceptionStrategy extends ExceptionStrategy {
  /**
   * 从HTTP异常中提取错误信息
   * @param exception HTTP异常对象
   * @returns 错误信息
   */
  extractErrorInfo: (exception: unknown) => {
    // 状态码
    statusCode: number
    // 错误消息
    message: string
    // 错误代码
    code: string
    // 错误详情
    details?: unknown
  }
}

/**
 * 业务异常策略接口
 * 专门处理业务异常的策略接口
 */
export interface BusinessExceptionStrategy extends ExceptionStrategy {
  /**
   * 提取业务错误代码
   * @param exception 业务异常对象
   * @returns 业务错误代码
   */
  extractBusinessCode: (exception: unknown) => string

  /**
   * 提取业务上下文信息
   * @param exception 业务异常对象
   * @returns 业务上下文信息
   */
  extractBusinessContext: (exception: unknown) => Record<string, unknown>

  /**
   * 生成错误建议
   * @param exception 业务异常对象
   * @returns 错误建议
   */
  generateSuggestions: (exception: unknown) => string[]
}

/**
 * 验证异常策略接口
 * 专门处理验证异常的策略接口
 */
export interface ValidationExceptionStrategy extends ExceptionStrategy {
  /**
   * 格式化验证错误消息
   * @param exception 验证异常对象
   * @returns 格式化后的错误消息
   */
  formatValidationErrors: (exception: unknown) => string[]

  /**
   * 提取字段级别的错误
   * @param exception 验证异常对象
   * @returns 字段错误映射
   */
  extractFieldErrors: (exception: unknown) => Record<string, string[]>
}

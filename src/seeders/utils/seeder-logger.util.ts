import { NestLoggerAdapter } from '@modules/logger'

/**
 * Seeder 专用日志工具
 * 提供统一的日志格式和上下文管理
 */
export class SeederLogger {
  private readonly logger: NestLoggerAdapter
  private readonly context: string

  constructor(seederName: string) {
    this.context = `Seeder:${seederName}`
    this.logger = new NestLoggerAdapter(this.context)
  }

  /**
   * 信息日志
   */
  info(message: string, meta?: Record<string, unknown>): void {
    const formattedMessage = meta ? `${message} ${JSON.stringify(meta)}` : message
    this.logger.log(formattedMessage)
  }

  /**
   * 警告日志
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    const formattedMessage = meta ? `${message} ${JSON.stringify(meta)}` : message
    this.logger.warn(formattedMessage)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorInfo = {
      error: error?.message,
      stack: error?.stack,
      ...meta,
    }
    const formattedMessage = `${message} ${JSON.stringify(errorInfo)}`
    this.logger.error(formattedMessage)
  }

  /**
   * 调试日志
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    const formattedMessage = meta ? `${message} ${JSON.stringify(meta)}` : message
    this.logger.debug(formattedMessage)
  }

  /**
   * 记录数据跳过信息
   */
  skip(entityName: string, count: number): void {
    this.info(`${entityName}表已有 ${count} 条数据，跳过填充`, {
      entityName,
      existingCount: count,
      action: 'skip',
    })
  }

  /**
   * 记录数据创建成功信息
   */
  success(entityName: string, count: number): void {
    this.info(`成功创建 ${count} 条${entityName}记录`, {
      entityName,
      createdCount: count,
      action: 'create',
    })
  }

  /**
   * 记录开始执行信息
   */
  start(message?: string): void {
    this.info(message || '开始执行数据填充', {
      action: 'start',
    })
  }

  /**
   * 记录完成信息
   */
  complete(message?: string): void {
    this.info(message || '数据填充完成', {
      action: 'complete',
    })
  }
}

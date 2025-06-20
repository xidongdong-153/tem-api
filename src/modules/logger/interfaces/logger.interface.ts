import type { LogLevel } from '../enums/log-level.enum'

/**
 * 日志上下文接口
 */
export interface LogContext {
  userId?: string
  requestId?: string
  module?: string
  method?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * 日志服务接口
 */
export interface ILoggerService {
  error: (message: string, context?: LogContext) => void
  warn: (message: string, context?: LogContext) => void
  info: (message: string, context?: LogContext) => void
  debug: (message: string, context?: LogContext) => void
  log: (level: LogLevel, message: string, context?: LogContext) => void
}

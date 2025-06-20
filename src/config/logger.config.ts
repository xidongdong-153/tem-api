import { registerAs } from '@nestjs/config'

export interface LoggerConfig {
  /** 日志级别 */
  level: 'error' | 'warn' | 'info' | 'debug'
  /** 是否启用控制台输出 */
  enableConsole: boolean
  /** 是否启用文件输出 */
  enableFile: boolean
  /** 日志格式 */
  format: 'json' | 'simple' | 'colorful'
  /** 文件配置 */
  fileConfig: {
    /** 日志文件名 */
    filename: string
    /** 最大文件大小 */
    maxSize: string
    /** 最大文件数量 */
    maxFiles: number
  }
}

export default registerAs('logger', (): LoggerConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'

  return {
    level: (process.env.LOG_LEVEL as LoggerConfig['level']) ?? 'info',
    enableConsole: process.env.LOG_ENABLE_CONSOLE === 'true' || isDevelopment,
    enableFile: process.env.LOG_ENABLE_FILE === 'true' || isProduction,
    format: (process.env.LOG_FORMAT as LoggerConfig['format']) ?? (isProduction ? 'json' : 'colorful'),
    fileConfig: {
      filename: process.env.LOG_FILE_NAME ?? 'app.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE ?? '10m',
      maxFiles: Number.parseInt(process.env.LOG_FILE_MAX_FILES ?? '7', 10),
    },
  }
})

import type { LogLevel } from '../enums/log-level.enum'

/**
 * 文件配置接口
 */
export interface FileConfig {
  filename: string
  maxSize: string
  maxFiles: number
}

/**
 * 日志配置接口
 */
export interface LogConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  fileConfig?: FileConfig
  format: 'json' | 'simple' | 'colorful'
}

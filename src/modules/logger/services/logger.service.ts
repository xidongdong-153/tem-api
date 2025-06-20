import type { LoggerConfig } from '../../../config'

import type { ILoggerService, LogConfig, LogContext } from '../interfaces'
import * as path from 'node:path'

import { Injectable } from '@nestjs/common'
import * as winston from 'winston'
import { ConfigService } from '../../config/services'
import { LogLevel } from '../enums'
import { LogFormatter } from '../utils'

/**
 * 日志服务类
 */
@Injectable()
export class LoggerService implements ILoggerService {
  private logger: winston.Logger
  private config: LogConfig

  constructor(private readonly configService: ConfigService) {
    this.initializeConfig()
    this.initializeLogger()
  }

  /**
   * 初始化配置
   */
  private initializeConfig(): void {
    const loggerConfig: LoggerConfig = this.configService.logger

    this.config = {
      level: loggerConfig.level as LogLevel,
      enableConsole: loggerConfig.enableConsole,
      enableFile: loggerConfig.enableFile,
      format: loggerConfig.format,
      fileConfig: {
        filename: loggerConfig.fileConfig.filename,
        maxSize: loggerConfig.fileConfig.maxSize,
        maxFiles: loggerConfig.fileConfig.maxFiles,
      },
    }
  }

  /**
   * 初始化Winston Logger
   */
  private initializeLogger(): void {
    const transports: winston.transport[] = []

    this.addConsoleTransport(transports)
    this.addFileTransports(transports)
    this.ensureDefaultTransport(transports)

    this.logger = winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false,
    })
  }

  /**
   * 添加控制台传输
   */
  private addConsoleTransport(transports: winston.transport[]): void {
    if (this.config.enableConsole) {
      // 根据配置和环境选择格式
      let format: winston.Logform.Format

      if (this.configService.isDevelopment && this.config.format === 'colorful') {
        format = LogFormatter.createColorfulFormat() // 开发环境：彩色格式
      }
      else if (this.config.format === 'simple') {
        format = LogFormatter.createSimpleFormat() // 简单格式
      }
      else {
        format = LogFormatter.createJsonFormat() // JSON格式
      }

      transports.push(
        new winston.transports.Console({ format }),
      )
    }
  }

  /**
   * 添加文件传输
   */
  private addFileTransports(transports: winston.transport[]): void {
    if (this.config.enableFile && this.config.fileConfig) {
      const logsDir = path.join(process.cwd(), 'logs')

      transports.push(
        new winston.transports.File({
          filename: path.join(logsDir, this.config.fileConfig.filename),
          maxsize: this.parseSize(this.config.fileConfig.maxSize),
          maxFiles: this.config.fileConfig.maxFiles,
          format: LogFormatter.createJsonFormat(),
        }),
      )

      // 错误日志单独文件
      transports.push(
        new winston.transports.File({
          level: 'error',
          filename: path.join(logsDir, 'error.log'),
          maxsize: this.parseSize(this.config.fileConfig.maxSize),
          maxFiles: this.config.fileConfig.maxFiles,
          format: LogFormatter.createJsonFormat(),
        }),
      )
    }
  }

  /**
   * 确保有默认传输
   */
  private ensureDefaultTransport(transports: winston.transport[]): void {
    if (transports.length === 0) {
      transports.push(
        new winston.transports.Console({
          format: LogFormatter.createSimpleFormat(),
        }),
      )
    }
  }

  /**
   * 解析文件大小字符串为字节数
   */
  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)([kmg]?)$/i)
    if (!match)
      return 10 * 1024 * 1024 // 默认10MB

    const size = Number.parseInt(match[1])
    const unit = match[2]?.toLowerCase()

    switch (unit) {
      case 'k':
        return size * 1024
      case 'm':
        return size * 1024 * 1024
      case 'g':
        return size * 1024 * 1024 * 1024
      default:
        return size
    }
  }

  /**
   * 统一日志记录方法
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    const sanitizedContext = LogFormatter.sanitizeContext(context)
    const enrichedContext = LogFormatter.addDefaultContext(sanitizedContext)

    this.logger.log(level, message, { context: enrichedContext })
  }

  /**
   * 错误级别日志
   */
  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context)
  }

  /**
   * 警告级别日志
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * 信息级别日志
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * 调试级别日志
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * 获取当前配置
   */
  getConfig(): LogConfig {
    return { ...this.config }
  }

  /**
   * 获取Winston Logger实例（用于高级用法）
   */
  getWinstonLogger(): winston.Logger {
    return this.logger
  }
}

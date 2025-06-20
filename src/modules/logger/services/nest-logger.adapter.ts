import type { LoggerService as NestLoggerService } from '@nestjs/common'
import * as winston from 'winston'

import { LogFormatter } from '../utils'

/**
 * NestJS Logger 适配器
 * 实现 NestJS LoggerService 接口，将日志调用转发到我们的 LoggerService
 */
export class NestLoggerAdapter implements NestLoggerService {
  private readonly winston: winston.Logger
  private context?: string

  constructor(context?: string) {
    this.context = context
    // 创建一个简单的 winston 实例用于启动阶段
    this.winston = this.createBootstrapLogger()
  }

  /**
   * 创建启动阶段的日志实例
   */
  private createBootstrapLogger(): winston.Logger {
    const nodeEnv = process.env.NODE_ENV ?? 'development'
    const isDevelopment = nodeEnv === 'development'

    const format = isDevelopment
      ? LogFormatter.createColorfulFormat()
      : LogFormatter.createSimpleFormat()

    return winston.createLogger({
      level: 'info',
      format,
      transports: [
        new winston.transports.Console(),
      ],
    })
  }

  /**
   * 格式化消息
   */
  private formatMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message
    }
    if (message instanceof Error) {
      // 处理 Error 对象：返回错误消息，如果没有消息则返回错误名称
      return message.message || message.name || 'Unknown Error'
    }
    if (typeof message === 'object' && message !== null) {
      return JSON.stringify(message)
    }
    return String(message)
  }

  /**
   * 处理 Error 对象的日志记录
   */
  private logErrorObject(error: Error, trace?: string, context?: string): void {
    const logContext = context ?? this.context ?? 'Unknown'

    const errorMessage = JSON.stringify(error)

    // 详细的错误信息放在上下文中
    const errorContext = {
      context: logContext,
      errorType: error.name,
      fullMessage: error.message,
      ...(error.stack != null && error.stack !== '' ? { stack: error.stack } : {}),
      ...(trace != null && trace !== '' ? { trace } : {}),
    }

    this.winston.error(`[${logContext}] ${error.name}: ${errorMessage}`, errorContext)
  }

  /**
   * 处理非 Error 对象的日志记录
   */
  private logNonErrorMessage(message: unknown, trace?: string, context?: string): void {
    const logContext = context ?? this.context ?? 'Unknown'
    const formattedMessage = this.formatMessage(message)

    // 为非Error对象也提供结构化的上下文
    const errorContext = {
      context: logContext,
      messageType: typeof message,
      ...(trace != null && trace !== '' ? { trace } : {}),
    }

    this.winston.error(`[${logContext}] ${formattedMessage}`, errorContext)
  }

  /**
   * 信息级别日志
   */
  log(message: unknown, context?: string): void {
    const formattedMessage = this.formatMessage(message)
    const logContext = context ?? this.context
    this.winston.info(formattedMessage, { context: logContext })
  }

  /**
   * 错误级别日志
   */
  error(message: unknown, trace?: string, context?: string): void {
    if (message instanceof Error) {
      this.logErrorObject(message, trace, context)
    }
    else {
      this.logNonErrorMessage(message, trace, context)
    }
  }

  /**
   * 警告级别日志
   */
  warn(message: unknown, context?: string): void {
    const formattedMessage = this.formatMessage(message)
    const logContext = context ?? this.context
    this.winston.warn(formattedMessage, { context: logContext })
  }

  /**
   * 调试级别日志
   */
  debug(message: unknown, context?: string): void {
    const formattedMessage = this.formatMessage(message)
    const logContext = context ?? this.context
    this.winston.debug(formattedMessage, { context: logContext })
  }

  /**
   * 详细级别日志（映射到debug）
   */
  verbose(message: unknown, context?: string): void {
    this.debug(message, context)
  }

  /**
   * 设置上下文
   */
  setContext(context: string): void {
    this.context = context
  }
}

import type { LogContext } from '../interfaces'

import * as winston from 'winston'

/**
 * 日志格式化工具类
 */
export class LogFormatter {
  // ANSI 颜色代码 - 优化后的颜色方案
  private static readonly colors = {
    // 日志级别颜色 - 使用亮色版本提高对比度
    error: '\x1B[91m', // 亮红色 (原31m改为91m)
    warn: '\x1B[93m', // 亮黄色 (原33m改为93m)
    info: '\x1B[94m', // 亮蓝色 (原36m改为94m，更易读)
    debug: '\x1B[95m', // 亮紫色 (原35m改为95m)

    // 辅助颜色
    reset: '\x1B[0m', // 重置
    bold: '\x1B[1m', // 粗体
    dim: '\x1B[2m', // 暗淡
    gray: '\x1B[90m', // 灰色
    green: '\x1B[92m', // 亮绿色 - 用于成功信息
    orange: '\x1B[38;5;208m', // 橙色 - 用于重要提示
    white: '\x1B[97m', // 亮白色 - 用于高亮

    // 背景色（用于重要信息）
    bgRed: '\x1B[101m', // 红色背景
    bgYellow: '\x1B[103m', // 黄色背景
  } as const

  // 日志级别图标
  private static readonly levelIcons = {
    error: '❌',
    warn: '⚠️ ',
    info: '📘',
    debug: '🔍',
  } as const

  // 敏感字段列表
  private static readonly sensitiveFields = [
    'password',
    'token',
    'authorization',
    'secret',
    'apiKey',
  ] as const

  /**
   * 创建开发环境彩色格式化器
   */
  static createColorfulFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, context, stack } = info

        // 获取级别相关的颜色和图标
        const levelKey = level as keyof typeof LogFormatter.levelIcons
        const levelColor = LogFormatter.colors[level as keyof typeof LogFormatter.colors] ?? LogFormatter.colors.reset
        const levelIcon = LogFormatter.levelIcons[levelKey] ?? ''
        const { reset, dim, bold, gray, white } = LogFormatter.colors

        // 格式化时间戳（使用灰色）
        const timeStr = `${gray}${String(timestamp)}${reset}`

        // 格式化级别（带图标和颜色）
        const levelStr = `${levelColor}${levelIcon} ${String(level).toUpperCase().padEnd(5)}${reset}`

        // 格式化消息（根据级别使用不同样式）
        const messageStr = LogFormatter.formatMessage(String(message), level, { white, bold, reset })

        // 格式化上下文
        const contextStr = LogFormatter.formatColorfulContext(context, { reset, dim, bold, gray })

        // 格式化堆栈信息
        const stackStr = LogFormatter.formatStackTrace(stack, dim, reset)

        // 组装最终输出，优化分行
        let output = `${timeStr} ${levelStr} ${messageStr}`

        // 如果有上下文信息，换行显示
        if (contextStr) {
          output += `\n${gray}       ↳${reset}${contextStr}`
        }

        // 如果有堆栈信息，换行显示
        if (stackStr) {
          output += stackStr
        }

        return output
      }),
    )
  }

  /**
   * 根据日志级别格式化消息
   */
  private static formatMessage(
    message: string,
    level: string,
    colors: { white: string, bold: string, reset: string },
  ): string {
    const { white, bold, reset } = colors

    // 错误级别使用粗体白色
    if (level === 'error') {
      return `${bold}${white}${message}${reset}`
    }

    // 警告级别使用粗体
    if (level === 'warn') {
      return `${bold}${message}${reset}`
    }

    // 其他级别正常显示
    return message
  }

  /**
   * 格式化彩色上下文
   */
  private static formatColorfulContext(
    context: unknown,
    colors: { reset: string, dim: string, bold: string, gray: string },
  ): string {
    const cleanContext = LogFormatter.cleanDevContext(context)
    if (!cleanContext || Object.keys(cleanContext).length === 0) {
      return ''
    }

    const parts: string[] = []
    const { reset, dim, gray } = colors

    // 处理模块和方法名
    LogFormatter.addModuleAndMethodParts(cleanContext, parts, colors)

    // 处理 stack 字段特殊显示
    if ('stack' in cleanContext && typeof cleanContext.stack === 'string') {
      return LogFormatter.formatContextWithStack(cleanContext, parts, colors)
    }

    // 处理其他字段
    LogFormatter.addRemainingFieldsParts(cleanContext, parts, gray, reset)

    return parts.length > 0 ? ` ${dim}[${parts.join(' ')}]${reset}` : ''
  }

  /**
   * 添加模块名和方法名部分
   */
  private static addModuleAndMethodParts(
    cleanContext: Record<string, string | number | boolean>,
    parts: string[],
    colors: { reset: string, bold: string },
  ): void {
    const { reset, bold } = colors

    // 模块名（粗体绿色）
    if (typeof cleanContext.module === 'string' && cleanContext.module.length > 0) {
      parts.push(`${bold}${LogFormatter.colors.green}${cleanContext.module}${reset}`)
      delete cleanContext.module
    }

    // 方法名（橙色）
    if (typeof cleanContext.method === 'string' && cleanContext.method.length > 0) {
      parts.push(`${LogFormatter.colors.orange}${cleanContext.method}()${reset}`)
      delete cleanContext.method
    }
  }

  /**
   * 格式化带有堆栈信息的上下文
   */
  private static formatContextWithStack(
    cleanContext: Record<string, string | number | boolean>,
    parts: string[],
    colors: { reset: string, dim: string, gray: string },
  ): string {
    const { reset, dim, gray } = colors
    const stackInfo = cleanContext.stack as string
    delete cleanContext.stack

    // 其他字段（灰色）
    LogFormatter.addRemainingFieldsParts(cleanContext, parts, gray, reset)

    // 单独显示堆栈信息
    return parts.length > 0
      ? ` ${dim}[${parts.join(' ')}]${reset}${LogFormatter.formatStackTrace(stackInfo, dim, reset)}`
      : LogFormatter.formatStackTrace(stackInfo, dim, reset)
  }

  /**
   * 添加剩余字段部分
   */
  private static addRemainingFieldsParts(
    cleanContext: Record<string, string | number | boolean>,
    parts: string[],
    gray: string,
    reset: string,
  ): void {
    if (Object.keys(cleanContext).length > 0) {
      parts.push(`${gray}${JSON.stringify(cleanContext)}${reset}`)
    }
  }

  /**
   * 格式化堆栈信息
   */
  private static formatStackTrace(stack: unknown, dim: string, reset: string): string {
    if (typeof stack === 'string' && stack.length > 0) {
      // 添加缩进和更好的视觉分隔
      const lines = stack.split('\n')
      const formattedLines = lines.map((line, index) => {
        if (index === 0) {
          return `\n${LogFormatter.colors.bgRed} STACK TRACE ${reset}`
        }
        return `${dim}       ${line}${reset}`
      })
      return formattedLines.join('\n')
    }
    return ''
  }

  /**
   * 创建简单格式化器（适用于开发环境）
   */
  static createSimpleFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, context, stack } = info

        // 清理context
        const cleanContext = LogFormatter.cleanDevContext(context)
        const contextStr = cleanContext && Object.keys(cleanContext).length > 0
          ? ` - ${JSON.stringify(cleanContext)}`
          : ''

        const stackStr = (typeof stack === 'string' && stack.length > 0) ? `\n${stack}` : ''
        return `${String(timestamp)} [${String(level).toUpperCase()}] ${String(message)}${contextStr}${stackStr}`
      }),
    )
  }

  /**
   * 创建JSON格式化器（适用于生产环境）
   */
  static createJsonFormat(): winston.Logform.Format {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { timestamp, level, message, context, stack, ...rest } = info

        // 清理context中的重复字段
        const cleanedContext = LogFormatter.cleanJsonContext(context)

        const logEntry: Record<string, unknown> = {
          timestamp,
          level,
          message,
        }

        // 添加清理后的context
        if (cleanedContext && Object.keys(cleanedContext).length > 0) {
          logEntry.context = cleanedContext
        }

        // 添加stack信息
        if (typeof stack === 'string' && stack.length > 0) {
          logEntry.stack = stack
        }

        // 添加其他字段
        Object.assign(logEntry, rest)

        return JSON.stringify(logEntry)
      }),
    )
  }

  /**
   * 清理JSON格式日志的上下文，避免重复字段
   */
  private static cleanJsonContext(context: unknown): Record<string, unknown> | null {
    if (context === null || context === undefined || typeof context !== 'object') {
      return null
    }

    const ctx = { ...(context as Record<string, unknown>) }

    // 移除重复的timestamp（Winston已在顶层添加）
    delete ctx.timestamp

    // 根据环境决定是否保留pid
    if (process.env.NODE_ENV === 'development') {
      delete ctx.pid // 开发环境移除pid
    }

    return Object.keys(ctx).length > 0 ? ctx : null
  }

  /**
   * 过滤敏感信息
   */
  static sanitizeContext(context?: LogContext): LogContext {
    if (!context) {
      return {}
    }

    const sanitized = { ...context }

    for (const field of LogFormatter.sensitiveFields) {
      if (sanitized[field] !== undefined && sanitized[field] !== null) {
        sanitized[field] = '***'
      }
    }

    return sanitized
  }

  /**
   * 清理开发环境上下文信息
   */
  private static cleanDevContext(context: unknown): Record<string, string | number | boolean> | null {
    if (context === null || context === undefined || typeof context !== 'object') {
      return null
    }

    const ctx = context as Record<string, unknown>
    const cleaned = LogFormatter.filterValidFields(ctx)

    LogFormatter.handleNestContext(ctx, cleaned)

    return Object.keys(cleaned).length > 0 ? cleaned : null
  }

  /**
   * 过滤有效字段
   */
  private static filterValidFields(ctx: Record<string, unknown>): Record<string, string | number | boolean> {
    const cleaned: Record<string, string | number | boolean> = {}

    for (const [key, value] of Object.entries(ctx)) {
      // 跳过冗余字段
      if (key === 'timestamp' || key === 'pid') {
        continue
      }

      // 只保留基本类型值
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value
      }
    }

    return cleaned
  }

  /**
   * 处理nestContext字段
   */
  private static handleNestContext(
    ctx: Record<string, unknown>,
    cleaned: Record<string, string | number | boolean>,
  ): void {
    if ('nestContext' in ctx && typeof ctx.nestContext === 'string') {
      if ('module' in ctx && ctx.nestContext !== ctx.module) {
        cleaned.nest = ctx.nestContext
      }
    }
  }

  /**
   * 添加默认上下文信息
   */
  static addDefaultContext(context?: LogContext): LogContext {
    const isDevelopment = process.env.NODE_ENV === 'development'

    // 开发环境简化上下文信息
    if (isDevelopment) {
      return context ?? {}
    }

    // 生产环境保留完整信息
    return {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      ...context,
    }
  }
}

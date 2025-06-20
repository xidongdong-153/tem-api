import type { LoggerNamespace } from '@mikro-orm/core'

import type { LogContext } from '../interfaces'
import type { LoggerService } from './logger.service'

import { LogLevel } from '../enums'

// ================================
// 类型定义
// ================================

/**
 * SQL查询结构化上下文接口
 */
interface SqlQueryContext extends LogContext {
  sql: string
  durationMs: number
  resultCount: number
  originalMessage: string
}

// ================================
// 常量定义
// ================================

/**
 * MikroORM 日志前缀（按长度优先排序，避免部分匹配问题）
 */
const MIKRO_ORM_PREFIXES = [
  '[discovery] -',
  '[info] -',
  '[query] -',
  '[error] -',
  '[warn] -',
  '[discovery]',
  '[info]',
  '[query]',
  '[error]',
  '[warn]',
] as const

/**
 * SQL 操作关键词
 */
const SQL_KEYWORDS = [
  'select',
  'insert',
  'update',
  'delete',
  'create table',
  'alter table',
  'drop table',
] as const

/**
 * 消息类型检测关键词
 */
const MESSAGE_KEYWORDS = {
  ERROR: ['error', 'failed', 'Error'],
  WARNING: ['warn', 'deprecated'],
  QUERY: ['[query]', 'select', 'insert', 'update', 'delete', 'took'],
} as const

/**
 * 格式化相关常量
 */
const FORMATTING = {
  SQL_MAX_LENGTH: 100,
  CONTEXT_MESSAGE_LENGTH: 100,
} as const

// ================================
// 工具函数 - 文本处理
// ================================

/**
 * 移除ANSI转义序列（颜色控制字符）
 */
function cleanAnsiEscapes(message: string): string {
  // eslint-disable-next-line no-control-regex
  return message.replace(/\u001B\[[0-9;]*m/g, '')
}

/**
 * 移除 MikroORM 日志前缀
 */
function removeMikroOrmPrefixes(message: string): string {
  let cleanedMessage = MIKRO_ORM_PREFIXES.reduce((msg, prefix) => {
    return msg.replace(`${prefix} `, '').replace(prefix, '')
  }, message)

  // 清理可能残留的前导 "-" 和空格
  cleanedMessage = cleanedMessage.replace(/^[\s-]+/, '').trim()

  return cleanedMessage
}

// ================================
// 工具函数 - 消息类型判断
// ================================

/**
 * 判断消息是否为错误级别
 */
function isErrorMessage(message: string): boolean {
  return MESSAGE_KEYWORDS.ERROR.some(keyword => message.includes(keyword))
}

/**
 * 判断消息是否为警告级别
 */
function isWarningMessage(message: string): boolean {
  return MESSAGE_KEYWORDS.WARNING.some(keyword => message.includes(keyword))
}

/**
 * 判断消息是否为查询相关
 */
function isQueryMessage(message: string): boolean {
  return MESSAGE_KEYWORDS.QUERY.some(keyword => message.includes(keyword))
    || (message.includes('took') && message.includes('ms'))
}

/**
 * 检查是否为SQL操作消息
 */
function isSqlOperationMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return SQL_KEYWORDS.some(keyword => lowerMessage.includes(keyword))
}

// ================================
// 工具函数 - 数据提取
// ================================

/**
 * 提取耗时信息
 */
function extractDuration(message: string): string | null {
  const match = message.match(/took (\d+) ms/)
  return match ? match[1] : null
}

/**
 * 提取结果数量
 */
function extractResultCount(message: string): string | null {
  const match = message.match(/(\d+) result/)
  return match ? match[1] : null
}

// ================================
// 核心功能 - SQL 查询解析
// ================================

/**
 * 解析SQL查询消息，提取结构化数据
 */
function parseSqlQueryMessage(message: string): { sql: string, durationMs: number, resultCount: number } | null {
  if (!isSqlOperationMessage(message)) {
    return null
  }

  const duration = extractDuration(message)
  const resultCount = extractResultCount(message)

  if (duration === null || resultCount === null) {
    return null
  }

  // 提取SQL语句（去除耗时和结果信息）
  const sqlPart = message.split('[took')[0].trim()
  const cleanedSql = removeMikroOrmPrefixes(sqlPart).trim()

  return {
    sql: cleanedSql,
    durationMs: Number.parseInt(duration, 10),
    resultCount: Number.parseInt(resultCount, 10),
  }
}

// ================================
// 核心功能 - 日志级别处理
// ================================

/**
 * 根据消息内容确定日志级别并记录
 */
function logMessageByLevel(
  message: string,
  formattedMessage: string,
  logContext: LogContext,
  loggerService: LoggerService,
): void {
  if (isErrorMessage(message)) {
    loggerService.error(formattedMessage, logContext)
  }
  else if (isWarningMessage(message)) {
    loggerService.warn(formattedMessage, logContext)
  }
  else if (isQueryMessage(message)) {
    // 检查是否为SQL查询，如果是则使用结构化日志
    const sqlQueryData = parseSqlQueryMessage(message)
    if (sqlQueryData) {
      const sqlContext: SqlQueryContext = {
        module: 'MikroORM',
        sql: sqlQueryData.sql,
        durationMs: sqlQueryData.durationMs,
        resultCount: sqlQueryData.resultCount,
        originalMessage: message,
      }
      loggerService.debug('SQL Query', sqlContext)
    }
    else {
      // 非SQL查询的其他查询相关日志
      loggerService.debug(formattedMessage, logContext)
    }
  }
  else {
    // 默认使用 info 级别
    loggerService.info(formattedMessage, logContext)
  }
}

// ================================
// 主要导出函数
// ================================

/**
 * 创建 MikroORM 简单日志函数
 * 返回 MikroORM 期望的 (message: string) => void 函数
 */
export function createMikroOrmLogger(loggerService: LoggerService): (message: string) => void {
  return (message: string) => {
    // 清理ANSI转义序列
    const cleanedMessage = cleanAnsiEscapes(message)

    // 解析 MikroORM 日志消息
    const formattedMessage = removeMikroOrmPrefixes(cleanedMessage)
    const logContext = {
      module: 'MikroORM',
      originalMessage: cleanedMessage.substring(0, FORMATTING.CONTEXT_MESSAGE_LENGTH), // 保留原始消息前100字符用于调试
    }

    // 根据消息内容判断日志级别并记录
    logMessageByLevel(cleanedMessage, formattedMessage, logContext, loggerService)
  }
}

/**
 * 获取 MikroORM 调试模式设置
 */
export function getMikroOrmDebugConfig(loggerService: LoggerService): boolean | LoggerNamespace[] {
  const logLevel = loggerService.getConfig().level

  switch (logLevel) {
    case LogLevel.DEBUG:
      // debug 级别：显示所有日志，包括查询详情
      return ['query', 'query-params', 'discovery', 'info', 'schema'] as LoggerNamespace[]
    case LogLevel.INFO:
      // info 级别：显示基本信息和查询，但不显示参数
      return ['query', 'discovery', 'info'] as LoggerNamespace[]
    case LogLevel.WARN:
    case LogLevel.ERROR:
      // warn/error 级别：只显示错误
      return false
    default:
      return ['query', 'info'] as LoggerNamespace[]
  }
}

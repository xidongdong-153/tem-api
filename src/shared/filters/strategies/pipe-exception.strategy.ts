import type { ExceptionContext, ExceptionHandleResult, ExceptionStrategy } from '../interfaces'

import { BadRequestException, HttpStatus } from '@nestjs/common'

/**
 * 管道异常处理策略
 * 专门处理NestJS内置管道的异常，提供更友好的错误消息
 */
export class PipeExceptionStrategy implements ExceptionStrategy {
  readonly name = 'PipeExceptionStrategy'
  readonly priority = 110 // 高于HttpExceptionStrategy，低于ValidationExceptionStrategy

  /**
   * 判断是否可以处理该异常
   */
  canHandle(exception: unknown, context: ExceptionContext): boolean {
    if (!(exception instanceof BadRequestException)) {
      return false
    }

    // 检查是否为管道异常
    return this.isPipeException(exception, context)
  }

  /**
   * 处理管道异常
   */
  handle(exception: unknown, context: ExceptionContext): ExceptionHandleResult {
    if (!this.canHandle(exception, context)) {
      throw new Error('PipeExceptionStrategy cannot handle this exception')
    }

    const badRequestException = exception as BadRequestException
    const pipeType = this.identifyPipeType(badRequestException, context)
    const friendlyMessage = this.generateFriendlyMessage(pipeType, badRequestException, context)

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: friendlyMessage,
      code: `PIPE_${pipeType}_ERROR`,
      details: {
        pipeType,
        field: this.extractFieldName(context),
        providedValue: this.extractProvidedValue(context),
        expectedType: this.getExpectedType(pipeType),
        suggestions: this.generateSuggestions(pipeType),
      },
    }
  }

  /**
   * 判断是否为管道异常
   */
  private isPipeException(exception: BadRequestException, _context: ExceptionContext): boolean {
    const message = exception.message
    const commonPipeMessages = [
      'Validation failed (numeric string is expected)',
      'Validation failed (uuid is expected)',
      'Validation failed (boolean string is expected)',
      'Validation failed (parseable array expected)',
      'Validation failed (enum string is expected)',
      'Validation failed (parseable float string is expected)',
    ]

    return commonPipeMessages.some(pipeMessage => message.includes(pipeMessage))
  }

  /**
   * 识别管道类型
   */
  private identifyPipeType(exception: BadRequestException, _context: ExceptionContext): string {
    const message = exception.message

    if (message.includes('numeric string is expected')) {
      return 'INT'
    }
    if (message.includes('parseable float string is expected')) {
      return 'FLOAT'
    }
    if (message.includes('boolean string is expected')) {
      return 'BOOL'
    }
    if (message.includes('parseable array expected')) {
      return 'ARRAY'
    }
    if (message.includes('uuid is expected')) {
      return 'UUID'
    }
    if (message.includes('enum string is expected')) {
      return 'ENUM'
    }

    return 'UNKNOWN'
  }

  /**
   * 生成友好的错误消息
   */
  private generateFriendlyMessage(
    pipeType: string,
    _exception: BadRequestException,
    context: ExceptionContext,
  ): string {
    const fieldName = this.extractFieldName(context)
    const providedValue = this.extractProvidedValue(context)

    const messages: Record<string, string> = {
      INT: `Parameter "${fieldName}" must be a valid integer, but provided value is "${providedValue}"`,
      FLOAT: `Parameter "${fieldName}" must be a valid float number, but provided value is "${providedValue}"`,
      BOOL: `Parameter "${fieldName}" must be a boolean value (true/false), but provided value is "${providedValue}"`,
      ARRAY: `Parameter "${fieldName}" must be a valid array format, but provided value is "${providedValue}"`,
      UUID: `Parameter "${fieldName}" must be a valid UUID format, but provided value is "${providedValue}"`,
      ENUM: `Parameter "${fieldName}" must be a predefined enum value, but provided value is "${providedValue}"`,
      UNKNOWN: `Parameter "${fieldName}" format is incorrect, provided value is "${providedValue}"`,
    }

    return messages[pipeType] || messages.UNKNOWN
  }

  /**
   * 从请求上下文中提取字段名
   */
  private extractFieldName(context: ExceptionContext): string {
    const url = context.request.url
    const segments = url.split('/')

    // 通常参数在路径的最后一段
    const lastSegment = segments[segments.length - 1]

    // 如果包含查询参数，提取参数名
    if (lastSegment.includes('?')) {
      const [path] = lastSegment.split('?')
      return this.getFieldNameFromPath(path, url)
    }

    return this.getFieldNameFromPath(lastSegment, url)
  }

  /**
   * 从路径中获取字段名
   */
  private getFieldNameFromPath(pathSegment: string, fullUrl: string): string {
    // 如果是路径参数（如 /users/:id），通常是 id
    if (fullUrl.includes('/users/')) {
      return 'id'
    }

    // 可以根据不同的路由模式添加更多识别逻辑
    if (fullUrl.includes('/posts/')) {
      return 'postId'
    }

    return 'parameter'
  }

  /**
   * 提取提供的值
   */
  private extractProvidedValue(context: ExceptionContext): string {
    const url = context.request.url
    const segments = url.split('/')
    const lastSegment = segments[segments.length - 1]

    // 如果包含查询参数
    if (lastSegment.includes('?')) {
      const [path] = lastSegment.split('?')
      return path
    }

    return lastSegment
  }

  /**
   * 获取期望的类型描述
   */
  private getExpectedType(pipeType: string): string {
    const types: Record<string, string> = {
      INT: 'Integer (e.g. 1, 42, -10)',
      FLOAT: 'Float number (e.g. 1.5, 3.14, -2.7)',
      BOOL: 'Boolean value (true or false)',
      ARRAY: 'Array (e.g. [1,2,3] or value1,value2,value3)',
      UUID: 'UUID format (e.g. 550e8400-e29b-41d4-a716-446655440000)',
      ENUM: 'Predefined enum value',
      UNKNOWN: 'Valid format',
    }

    return types[pipeType] || types.UNKNOWN
  }

  /**
   * 生成修复建议
   */
  private generateSuggestions(pipeType: string): string[] {
    const suggestions: Record<string, string[]> = {
      INT: [
        'Please ensure the provided value is an integer',
        'Check if path parameter contains non-numeric characters',
        'If it is a query parameter, ensure parameter value is a valid integer',
      ],
      FLOAT: [
        'Please ensure the provided value is a valid float number',
        'Use decimal point to separate integer and decimal parts',
        'Avoid using non-numeric characters',
      ],
      BOOL: [
        'Use true or false as parameter value',
        'Some interfaces also accept 1/0 or yes/no',
        'Ensure parameter value spelling is correct',
      ],
      ARRAY: [
        'Use comma-separated format: value1,value2,value3',
        'Or use JSON array format: [1,2,3]',
        'Check if array element format is correct',
      ],
      UUID: [
        'Use standard UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        'Ensure UUID contains correct characters and hyphens',
        'Check if UUID length is 36 characters',
      ],
      ENUM: [
        'Check API documentation for available enum values',
        'Check if parameter value case is correct',
        'Ensure using valid enum options',
      ],
      UNKNOWN: [
        'Check API documentation for correct parameter format',
        'Check if parameter value matches expected type',
      ],
    }

    return suggestions[pipeType] || suggestions.UNKNOWN
  }
}

import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'

import { Injectable } from '@nestjs/common'
import { tap } from 'rxjs/operators'
import { LoggerService } from '../../modules/logger'

// 定义 Fastify 请求和响应的基本接口
interface FastifyRequest {
  method: string
  url: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
  query?: Record<string, unknown>
  params?: Record<string, unknown>
  ip?: string
}

interface FastifyReply {
  statusCode: number
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const response = context.switchToHttp().getResponse<FastifyReply>()
    const startTime = Date.now()

    // 记录请求开始
    this.logRequestStart(request)

    return next.handle().pipe(
      tap({
        next: (data: unknown) => this.logRequestSuccess(request, response, data, startTime),
        error: (error: Error) => this.logRequestError(request, response, error, startTime),
      }),
    )
  }

  /**
   * 记录请求开始
   */
  private logRequestStart(request: FastifyRequest): void {
    const { method, url, headers, body, query, params } = request
    const userAgent = (headers['user-agent'] as string) ?? ''
    const clientIp = this.getClientIp(request)

    this.logger.info('HTTP Start', {
      method,
      url,
      userAgent,
      clientIp,
      queryString: this.hasKeys(query) ? JSON.stringify(query) : undefined,
      paramsString: this.hasKeys(params) ? JSON.stringify(params) : undefined,
      bodySize: this.safeStringify(body).length,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * 记录请求成功
   */
  private logRequestSuccess(
    request: FastifyRequest,
    response: FastifyReply,
    data: unknown,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime
    const { method, url, headers } = request
    const userAgent = (headers['user-agent'] as string) ?? ''
    const clientIp = this.getClientIp(request)

    this.logger.info('HTTP End', {
      method,
      url,
      statusCode: response.statusCode,
      duration: `${duration}ms`,
      responseSize: this.safeStringify(data).length,
      clientIp,
      userAgent,
      success: true,
    })
  }

  /**
   * 记录请求错误
   */
  private logRequestError(
    request: FastifyRequest,
    response: FastifyReply,
    error: Error,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime
    const { method, url, headers } = request
    const userAgent = (headers['user-agent'] as string) ?? ''
    const clientIp = this.getClientIp(request)

    this.logger.error('HTTP Error', {
      method,
      url,
      statusCode: response.statusCode || 500,
      duration: `${duration}ms`,
      errorMessage: error.message,
      errorName: error.name,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      clientIp,
      userAgent,
      success: false,
    })
  }

  /**
   * 安全地将值转换为 JSON 字符串
   */
  private safeStringify(value: unknown): string {
    try {
      return value != null ? JSON.stringify(value) : ''
    }
    catch {
      return String(value) || ''
    }
  }

  /**
   * 检查对象是否有键
   */
  private hasKeys(obj?: Record<string, unknown>): boolean {
    return Boolean(obj && Object.keys(obj).length > 0)
  }

  /**
   * 获取客户端真实 IP 地址
   */
  private getClientIp(request: FastifyRequest): string {
    // 优先级: x-forwarded-for > x-real-ip > x-client-ip > request.ip
    const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'x-client-ip'] as const

    for (const header of ipHeaders) {
      const ip = this.extractIpFromHeader(request.headers[header])
      if (ip !== null) {
        return ip
      }
    }

    return request.ip ?? 'unknown'
  }

  /**
   * 从请求头中提取 IP 地址
   */
  private extractIpFromHeader(headerValue: string | string[] | undefined): string | null {
    if (headerValue == null) {
      return null
    }

    if (typeof headerValue === 'string') {
      return headerValue.split(',')[0].trim()
    }

    if (Array.isArray(headerValue) && headerValue.length > 0) {
      return headerValue[0]
    }

    return null
  }
}

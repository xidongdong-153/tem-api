/**
 * Fastify 请求接口定义
 */
export interface FastifyRequest {
  method: string
  url: string
  ip?: string
  headers: Record<string, string | string[] | undefined>
}

/**
 * Fastify 响应接口定义
 */
export interface FastifyReply {
  status: (code: number) => FastifyReply
  send: (payload: unknown) => FastifyReply
}

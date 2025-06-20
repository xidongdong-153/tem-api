import { registerAs } from '@nestjs/config'

export interface SwaggerConfig {
  /** 是否启用 Swagger 文档 */
  enabled: boolean
  /** 文档标题 */
  title: string
  /** 文档描述 */
  description: string
  /** API 版本 */
  version: string
  /** 文档路径 */
  path: string
  /** 是否启用认证 */
  enableAuth: boolean
  /** 是否持久化认证状态 */
  persistAuthorization: boolean
  /** 服务器配置 */
  servers?: Array<{
    url: string
    description: string
  }>
}

/**
 * 解析布尔值环境变量
 */
function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined)
    return defaultValue
  return value.toLowerCase() === 'true'
}

/**
 * 解析 Swagger 启用状态
 */
function parseSwaggerEnabled(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const isDevelopment = nodeEnv === 'development'
  const swaggerEnabled = process.env.SWAGGER_ENABLED

  // 如果明确设置了 SWAGGER_ENABLED，使用该值
  if (swaggerEnabled !== undefined) {
    return parseBooleanEnv(swaggerEnabled, false)
  }

  // 否则，开发环境默认启用，其他环境默认禁用
  return isDevelopment
}

export default registerAs('swagger', (): SwaggerConfig => ({
  enabled: parseSwaggerEnabled(),
  title: process.env.SWAGGER_TITLE ?? 'TEM API',
  description: process.env.SWAGGER_DESCRIPTION ?? 'TEM API 接口文档',
  version: process.env.SWAGGER_VERSION ?? '1.0.0',
  path: process.env.SWAGGER_PATH ?? 'api-docs',
  enableAuth: parseBooleanEnv(process.env.SWAGGER_ENABLE_AUTH, true),
  persistAuthorization: parseBooleanEnv(process.env.SWAGGER_PERSIST_AUTH, true),
  servers: undefined, // 暂时设为 undefined，可以后续扩展
}))

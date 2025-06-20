import { registerAs } from '@nestjs/config'

export interface AppConfig {
  /** 应用运行端口 */
  port: number
  /** 应用运行环境 */
  nodeEnv: string
  /** API 全局前缀 */
  globalPrefix: string
  /** 是否开启 CORS */
  enableCors: boolean
}

export default registerAs('app', (): AppConfig => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  globalPrefix: process.env.GLOBAL_PREFIX ?? 'api',
  enableCors: process.env.ENABLE_CORS === 'true' || process.env.NODE_ENV === 'development',
}))

import { registerAs } from '@nestjs/config'

export interface DatabaseConfig {
  /** 数据库主机地址 */
  host: string
  /** 数据库端口 */
  port: number
  /** 数据库用户名 */
  username: string
  /** 数据库密码 */
  password: string
  /** 数据库名称 */
  dbName: string
  /** 连接超时时间（毫秒） */
  connectTimeout: number
  /** 连接池最大连接数 */
  maxConnections: number
}

/**
 * 解析连接配置
 */
function getConnectionConfig() {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'tem_user',
    password: process.env.DB_PASSWORD ?? 'tem123456',
    dbName: process.env.DB_DATABASE_NAME ?? 'tem_dev',
  }
}

/**
 * 解析性能配置
 */
function getPerformanceConfig() {
  return {
    connectTimeout: Number.parseInt(process.env.DB_CONNECT_TIMEOUT ?? '60000', 10),
    maxConnections: Number.parseInt(process.env.DB_MAX_CONNECTIONS ?? '10', 10),
  }
}

export default registerAs('database', (): DatabaseConfig => {
  return {
    ...getConnectionConfig(),
    ...getPerformanceConfig(),
  }
})

import { existsSync } from 'node:fs'

import { defineConfig, MySqlDriver } from '@mikro-orm/mysql'
import { config } from 'dotenv'

// 手动加载环境变量文件
function loadEnvConfig() {
  const nodeEnv = process.env.NODE_ENV ?? 'development'
  const envFiles = [
    `.env.${nodeEnv}`,
    '.env',
  ]

  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      try {
        config({ path: envFile })
        break
      }
      catch (error) {
        console.error(`❌ 加载环境变量文件失败: ${envFile}`, error)
      }
    }
  }
}

// 初始化环境变量
loadEnvConfig()

/**
 * 解析连接配置
 */
function getConnectionConfig() {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    dbName: process.env.DB_DATABASE_NAME ?? 'tem_api',
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

// 生成配置
const connectionConfig = getConnectionConfig()
const performanceConfig = getPerformanceConfig()

export default defineConfig({
  dbName: connectionConfig.dbName,
  driver: MySqlDriver,
  driverOptions: {
    connection: {
      host: connectionConfig.host,
      port: connectionConfig.port,
      user: connectionConfig.username,
      password: connectionConfig.password,
      connectTimeout: performanceConfig.connectTimeout,
    },
  },
  pool: {
    max: performanceConfig.maxConnections,
  },
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  migrations: {
    path: './src/migrations',
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    dropTables: true,
    safe: false,
    snapshot: true,
    emit: 'ts',
  },
  seeder: {
    path: './src/seeders',
    emit: 'ts',
    defaultSeeder: 'DatabaseSeeder',
  },
  forceUtcTimezone: true,
  allowGlobalContext: true,
})

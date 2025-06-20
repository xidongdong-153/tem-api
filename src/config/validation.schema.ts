import * as Joi from 'joi'

/**
 * 环境变量验证模式
 * 使用 Joi 确保所有环境变量的类型安全和有效性
 */
export const validationSchema = Joi.object({
  // 应用配置
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number()
    .port()
    .default(3000),
  GLOBAL_PREFIX: Joi.string()
    .default('api'),
  ENABLE_CORS: Joi.boolean()
    .default(true),

  // 日志配置
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  LOG_ENABLE_CONSOLE: Joi.boolean()
    .default(true),
  LOG_ENABLE_FILE: Joi.boolean()
    .default(false),
  LOG_FORMAT: Joi.string()
    .valid('json', 'simple', 'colorful')
    .default('simple'),
  LOG_FILE_NAME: Joi.string()
    .default('app.log'),
  LOG_FILE_MAX_SIZE: Joi.string()
    .pattern(/^\d+[kmg]?$/i)
    .default('10m'),
  LOG_FILE_MAX_FILES: Joi.number()
    .integer()
    .min(1)
    .default(7),

  // Swagger 配置
  SWAGGER_ENABLED: Joi.boolean()
    .default(true),
  SWAGGER_TITLE: Joi.string()
    .default('TEM API'),
  SWAGGER_DESCRIPTION: Joi.string()
    .default('TEM API 接口文档'),
  SWAGGER_VERSION: Joi.string()
    .default('1.0.0'),
  SWAGGER_PATH: Joi.string()
    .default('api-docs'),
  SWAGGER_ENABLE_AUTH: Joi.boolean()
    .default(true),
  SWAGGER_PERSIST_AUTH: Joi.boolean()
    .default(true),

  // 认证配置
  JWT_SECRET: Joi.string()
    .min(32)
    .default('your-secret-key-please-change-in-production'),
  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('24h'),
  JWT_ISSUER: Joi.string()
    .optional(),
  JWT_AUDIENCE: Joi.string()
    .optional(),
  BCRYPT_ROUNDS: Joi.number()
    .integer()
    .min(8)
    .max(15)
    .default(10),
  PASSWORD_MIN_LENGTH: Joi.number()
    .integer()
    .min(6)
    .max(50)
    .default(6),
  ENABLE_REFRESH_TOKEN: Joi.boolean()
    .default(false),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),

  // 数据库配置
  DB_HOST: Joi.string()
    .default('localhost'),
  DB_PORT: Joi.number()
    .port()
    .default(3306),
  DB_USERNAME: Joi.string()
    .default('root'),
  DB_PASSWORD: Joi.string()
    .allow('')
    .default(''),
  DB_DATABASE: Joi.string()
    .default('tem_api'),
  DB_LOGGING: Joi.boolean()
    .default(true),
  DB_CONNECT_TIMEOUT: Joi.number()
    .integer()
    .min(1000)
    .default(60000),
  DB_MAX_CONNECTIONS: Joi.number()
    .integer()
    .min(1)
    .default(10),
})

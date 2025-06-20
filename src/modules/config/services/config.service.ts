import type { AppConfig, AuthConfig, DatabaseConfig, LoggerConfig, SwaggerConfig } from '../../../config'

import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'

/**
 * 配置服务
 * 提供类型安全的配置访问方法
 */
@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  /**
   * 获取应用配置
   */
  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!
  }

  /**
   * 获取认证配置
   */
  get auth(): AuthConfig {
    return this.configService.get<AuthConfig>('auth')!
  }

  /**
   * 获取日志配置
   */
  get logger(): LoggerConfig {
    return this.configService.get<LoggerConfig>('logger')!
  }

  /**
   * 获取数据库配置
   */
  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('database')!
  }

  /**
   * 获取 Swagger 配置
   */
  get swagger(): SwaggerConfig {
    return this.configService.get<SwaggerConfig>('swagger')!
  }

  /**
   * 获取指定配置项
   * @param key 配置键
   * @param defaultValue 默认值
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.configService.get(key, defaultValue)
  }

  /**
   * 获取当前运行环境
   */
  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development'
  }

  /**
   * 获取当前是否为生产环境
   */
  get isProduction(): boolean {
    return this.app.nodeEnv === 'production'
  }
}

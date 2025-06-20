import { Global, Module } from '@nestjs/common'

import { ConfigService } from './services'

/**
 * 配置模块
 * 全局模块，提供类型安全的配置服务
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {
}

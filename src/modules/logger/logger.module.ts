import { Global, Module } from '@nestjs/common'
import { LoggerService, NestLoggerAdapter } from './services'

/**
 * 日志模块
 * 使用 @Global() 装饰器让日志服务在整个应用中全局可用
 */
@Global()
@Module({
  providers: [
    LoggerService,
    {
      provide: 'NEST_LOGGER',
      useFactory: () => new NestLoggerAdapter('Application'),
    },
  ],
  exports: [LoggerService, 'NEST_LOGGER'],
})
export class LoggerModule {}

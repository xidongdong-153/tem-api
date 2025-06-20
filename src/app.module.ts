import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'

import { AppController } from './app.controller'
import { appConfig, authConfig, databaseConfig, loggerConfig, swaggerConfig, validationSchema } from './config'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from './modules/config/config.module'
import { DatabaseModule } from './modules/database/database.module'
import { LoggerModule } from './modules/logger/logger.module'
import { UsersModule } from './modules/users'
import { GlobalExceptionFilter, HttpLoggingInterceptor, PaginationResponseStrategy, ResponseSerializationInterceptor, StandardResponseStrategy } from './shared'

@Module({
  imports: [
    // NestJS Config 模块配置
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, loggerConfig, swaggerConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    // 策略提供者
    StandardResponseStrategy,
    PaginationResponseStrategy,
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 拦截器提供者
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseSerializationInterceptor,
    },
  ],
})
export class AppModule {}

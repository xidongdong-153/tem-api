import { LoggerModule } from '@modules/logger'
import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { appConfig, authConfig, databaseConfig, loggerConfig, swaggerConfig, validationSchema } from './config'
import { ArticlesModule } from './modules/articles'
import { AuthModule } from './modules/auth/auth.module'
import { CategoriesModule } from './modules/categories'
import { ConfigModule } from './modules/config/config.module'
import { DatabaseModule } from './modules/database/database.module'
import { TagsModule } from './modules/tags'
import { UsersModule } from './modules/users'
import { ApiTransformInterceptor, GlobalExceptionFilter } from './shared'

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
    ArticlesModule,
    CategoriesModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 全局响应拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiTransformInterceptor,
    },
  ],
})
export class AppModule {}

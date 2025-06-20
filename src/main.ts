import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { SwaggerConfig } from './config'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter } from '@nestjs/platform-fastify'

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ConfigService } from './modules/config/services'
import { LoggerService, NestLoggerAdapter } from './modules/logger'

/**
 * 创建 NestJS 应用实例
 */
async function createApp(): Promise<NestFastifyApplication> {
  const winstonLogger = new NestLoggerAdapter('Bootstrap')

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({}),
    {
      logger: winstonLogger,
    },
  )

  app.useLogger(winstonLogger)
  return app
}

/**
 * 配置应用基础设置
 */
function configureApp(app: NestFastifyApplication, configService: ConfigService): void {
  // 设置全局 API 前缀
  app.setGlobalPrefix(configService.app.globalPrefix)

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 过滤掉不在DTO中定义的属性
      forbidNonWhitelisted: true, // 当有额外属性时抛出错误
    }),
  )

  // 启用 CORS（如果配置允许）
  if (configService.app.enableCors) {
    app.enableCors()
  }
}

/**
 * 配置 Swagger 文档
 */
function setupSwagger(app: NestFastifyApplication, swaggerConfig: SwaggerConfig): void {
  const config = new DocumentBuilder()
    .setTitle(swaggerConfig.title)
    .setDescription(swaggerConfig.description)
    .setVersion(swaggerConfig.version)

  // 添加认证配置
  if (swaggerConfig.enableAuth) {
    config.addBearerAuth()
  }

  const document = SwaggerModule.createDocument(app, config.build())

  // 为 Fastify 设置 Swagger UI
  SwaggerModule.setup(swaggerConfig.path, app, document, {
    swaggerOptions: {
      persistAuthorization: swaggerConfig.persistAuthorization,
    },
  })
}

/**
 * 应用启动函数
 */
async function bootstrap() {
  const app = await createApp()
  const configService = app.get(ConfigService)

  // 配置应用
  configureApp(app, configService)

  // 配置 Swagger（如果启用）
  const swaggerConfig = configService.swagger
  if (swaggerConfig.enabled) {
    setupSwagger(app, swaggerConfig)
  }

  await app.listen(configService.app.port, '0.0.0.0')

  if (configService.isDevelopment) {
    app.get(LoggerService).info(`🚀 Application is running on: http://localhost:${configService.app.port}`)
    app.get(LoggerService).info(`🔗 Swagger is running on: http://localhost:${configService.app.port}/${configService.swagger.path}`)
  }
}

bootstrap()

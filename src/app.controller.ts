import { EntityManager } from '@mikro-orm/mysql'
import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from './modules/auth/guards'
import { ConfigService } from './modules/config/services'
import { LoggerService } from './modules/logger'

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly em: EntityManager,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取欢迎信息' })
  getHello(): string {
    return 'Hello World - TEM API service is running'
  }

  @Get('config')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取应用配置信息' })
  @UseGuards(JwtAuthGuard)
  getConfig(): object {
    return {
      app: this.configService.app,
      logger: this.configService.logger,
      database: this.configService.database,
      swagger: this.configService.swagger,
      environment: {
        isDevelopment: this.configService.isDevelopment,
        isProduction: this.configService.isProduction,
      },
    }
  }
}

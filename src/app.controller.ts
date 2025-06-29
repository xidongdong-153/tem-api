import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ConfigService } from './modules/config/services'
import { JwtAuthGuard } from './shared'

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
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

import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/services/config.service'
import { LoggerModule } from '../logger/logger.module'
import { UsersModule } from '../users/users.module'

import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { TokenBlacklistService } from './services/token-blacklist.service'
import { JwtStrategy } from './strategies/jwt.strategy'

/**
 * 认证模块 - 负责用户认证与授权
 */
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.auth.jwtSecret,
        signOptions: {
          expiresIn: configService.auth.jwtExpiresIn,
          issuer: configService.auth.jwtIssuer,
          audience: configService.auth.jwtAudience,
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ConfigModule,
    LoggerModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenBlacklistService, JwtStrategy],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}

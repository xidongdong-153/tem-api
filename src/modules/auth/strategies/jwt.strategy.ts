import { forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { ConfigService } from '../../config/services/config.service'
import { UserEntity } from '../../users/entities'
import { UsersService } from '../../users/services/users.service'
import { AuthService } from '../services/auth.service'
import { TokenBlacklistService } from '../services/token-blacklist.service'

/**
 * JWT策略 - 用于验证JWT令牌
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtSecret,
      issuer: configService.auth.jwtIssuer,
      audience: configService.auth.jwtAudience,
      passReqToCallback: true, // 允许获取原始请求，用于提取token
    })
  }

  /**
   * 验证JWT载荷
   * 这个方法会在JWT验证成功后自动调用
   */
  async validate(req: Request, payload: { sub: number, email: string, username: string }): Promise<UserEntity> {
    const { sub: userId } = payload

    // 从请求头中提取token
    const authHeader = (req as { headers?: { authorization?: string } }).headers?.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authentication header')
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 检查token是否在黑名单中
    if (this.tokenBlacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked')
    }

    // 检查token是否在活跃列表中
    if (!this.authService.isTokenActive(userId, token)) {
      throw new UnauthorizedException('Token is no longer active')
    }

    // 根据用户ID查找用户
    const user = await this.usersService.findOne(userId)

    // 检查用户是否存在且处于活跃状态
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User does not exist or is disabled')
    }

    // 返回用户信息，会自动附加到request.user
    return user
  }
}

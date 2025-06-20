import type { AuthResponseDto } from '../dtos/auth-response.dto'
import type { ChangePasswordDto } from '../dtos/change-password.dto'
import type { LoginDto } from '../dtos/login.dto'
import type { RefreshTokenDto } from '../dtos/refresh-token.dto'
import type { RegisterDto } from '../dtos/register.dto'

import * as crypto from 'node:crypto'
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

import { ConfigService } from '../../config/services/config.service'
import { User } from '../../users/entities/user.entity'
import { UsersService } from '../../users/services/users.service'
import { TokenBlacklistService } from './token-blacklist.service'

/**
 * 认证服务 - 负责用户认证逻辑
 *
 * 设计原则：
 * 1. 单一职责 - 只负责认证相关逻辑
 * 2. 依赖注入 - 通过构造函数注入依赖
 * 3. 安全优先 - 密码加密、错误处理
 */
@Injectable()
export class AuthService {
  // 简单的内存存储，生产环境应使用Redis或数据库
  private readonly refreshTokens = new Map<string, { userId: number, expiresAt: Date }>()

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // 加密密码
    const hashedPassword = await bcrypt.hash(registerDto.password, this.configService.auth.bcryptRounds)

    // 创建用户（密码已加密）
    const user = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      nickname: registerDto.nickname,
    })

    // 设置用户密码
    await this.usersService.updatePassword(user.id, hashedPassword)

    // 生成并返回token
    return this.generateAuthResponse(user)
  }

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // 验证用户凭据
    const user = await this.validateUser(loginDto.email, loginDto.password)

    if (!user) {
      throw new BadRequestException('Email or password is incorrect')
    }

    // 生成并返回token
    return this.generateAuthResponse(user)
  }

  /**
   * 验证用户凭据
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      // 通过邮箱查找用户
      const user = await this.usersService.findByEmail(email)

      if (!user || !user.isActive) {
        return null
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

      if (!isPasswordValid) {
        return null
      }

      return user
    }
    catch (error) {
      return error
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto

    // 验证刷新令牌
    const tokenData = this.refreshTokens.get(refreshToken)

    if (!tokenData || tokenData.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken) // 清理过期token
      throw new UnauthorizedException('Refresh token is invalid or expired')
    }

    // 获取用户信息
    const user = await this.usersService.findOne(tokenData.userId)
    if (!user || !user.isActive) {
      this.refreshTokens.delete(refreshToken) // 清理无效用户的token
      throw new UnauthorizedException('User does not exist or is disabled')
    }

    // 删除旧的刷新令牌
    this.refreshTokens.delete(refreshToken)

    // 生成新的访问令牌和刷新令牌
    return this.generateAuthResponse(user)
  }

  /**
   * 生成认证响应
   */
  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    }

    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.generateRefreshToken(user.id)

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiresInToSeconds(this.configService.auth.jwtExpiresIn),
    }
  }

  /**
   * 生成刷新令牌
   */
  private generateRefreshToken(userId: number): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + this.parseExpiresInToSeconds(this.configService.auth.refreshTokenExpiresIn))

    this.refreshTokens.set(token, { userId, expiresAt })
    return token
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto

    // 验证新密码确认
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password does not match confirm password')
    }

    // 验证新密码不能与旧密码相同
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password cannot be the same as the current password')
    }

    // 获取用户信息
    const user = await this.usersService.findOne(userId)

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect')
    }

    // 加密新密码
    const newHashedPassword = await bcrypt.hash(newPassword, this.configService.auth.bcryptRounds)

    // 更新密码
    await this.usersService.updatePassword(user.id, newHashedPassword)

    return { message: 'Password changed successfully' }
  }

  /**
   * 用户注销 - 将token加入黑名单
   */
  async logout(token: string, userId: number): Promise<{ message: string }> {
    // 将token加入黑名单
    this.tokenBlacklistService.addToBlacklist(token, userId, 'User logged out')

    return { message: 'Logout successful' }
  }

  /**
   * 强制下线用户（管理员功能）
   */
  async forceLogoutUser(userId: number, reason: string = 'Admin forced logout'): Promise<{ message: string }> {
    this.tokenBlacklistService.blacklistUserTokens(userId, reason)

    return { message: 'User has been forced offline' }
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresInToSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      return 24 * 60 * 60 // 默认24小时
    }

    const [, value, unit] = match
    const num = Number.parseInt(value, 10)

    switch (unit) {
      case 's': return num
      case 'm': return num * 60
      case 'h': return num * 60 * 60
      case 'd': return num * 24 * 60 * 60
      default: return 24 * 60 * 60
    }
  }
}

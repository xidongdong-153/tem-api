import { Body, Controller, Get, Post, Request, UnauthorizedException, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'

import { SerializeResponse } from 'src/shared'
import { User } from '../../users/entities/user.entity'
import { AuthResponseDto, ChangePasswordDto, LoginDto, RefreshTokenDto, RegisterDto } from '../dtos'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthService } from '../services/auth.service'

/**
 * 认证控制器 - 处理用户认证相关的HTTP请求
 *
 * 设计原则：
 * 1. 职责单一 - 只处理认证相关的请求
 * 2. 接口清晰 - 明确的输入输出定义
 * 3. 安全优先 - 合理的错误处理和验证
 */
@ApiTags('用户认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   */
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return await this.authService.register(registerDto)
  }

  /**
   * 用户登录
   */
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto)
  }

  /**
   * 获取当前用户信息
   * 这是一个受保护的接口，需要JWT认证
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @SerializeResponse({
    strategy: 'standard',
    exclude: ['passwordHash', 'isDeleted'],
    message: '用户信息获取成功',
  })
  async getProfile(@Request() req: { user: User }) {
    const user = req.user

    return user
  }

  /**
   * 修改密码
   * 需要用户认证，验证旧密码后设置新密码
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(
    @Request() req: { user: User },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.changePassword(req.user.id, changePasswordDto)
  }

  /**
   * 刷新访问令牌
   * 使用刷新令牌获取新的访问令牌
   */
  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return await this.authService.refreshAccessToken(refreshTokenDto)
  }

  /**
   * 用户注销
   * 将当前token加入黑名单，确保无法再次使用
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户注销' })
  @SerializeResponse({
    strategy: 'raw',
  })
  async logout(@Request() req: { user: User, headers: { authorization?: string } }): Promise<{ message: string }> {
    // 从请求头中提取token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('无效的认证头')
    }

    const token = authHeader.substring(7) // 移除 "Bearer " 前缀

    // 调用认证服务进行注销（将token加入黑名单）
    return await this.authService.logout(token, req.user.id)
  }
}

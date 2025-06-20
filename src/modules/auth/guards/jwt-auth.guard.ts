import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT认证守卫
 *
 * 用途：保护需要认证的接口
 * 原理：自动验证Authorization头中的JWT token
 *
 * 使用方式：
 * @UseGuards(JwtAuthGuard)
 * 或者在控制器类上使用 @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 这里可以添加自定义逻辑，比如特殊的认证规则
  // 目前保持简单，使用默认的JWT验证
}

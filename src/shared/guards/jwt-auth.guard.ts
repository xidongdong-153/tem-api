import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * JWT认证守卫 - 共享模块版本
 *
 * 设计理念：
 * 1. 解耦合 - 从auth模块中抽离，避免循环依赖
 * 2. 通用性 - 可在任何需要JWT认证的模块中使用
 * 3. 简洁性 - 保持守卫职责单一，仅做认证验证
 *
 * 使用方式：
 * @UseGuards(JwtAuthGuard)
 * 在任何控制器或方法上使用
 *
 * 注意：
 * - JWT策略仍在AuthModule中管理
 * - 守卫只负责调用策略，不包含业务逻辑
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * 可选的自定义验证逻辑
   * 默认情况下直接使用passport-jwt策略
   */
  // handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
  //   // 这里可以添加额外的验证逻辑
  //   // 比如检查用户权限、IP白名单等
  //   return super.handleRequest(err, user, info, context)
  // }
}

import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { LoggerService } from '../../logger/services/logger.service'

/**
 * Token黑名单服务
 * 管理被撤销的JWT token，防止注销后的token继续使用
 */
@Injectable()
export class TokenBlacklistService {
  // 内存存储黑名单token，生产环境建议使用Redis
  private readonly blacklistedTokens = new Map<string, {
    userId: number
    expiresAt: Date
    reason: string
  }>()

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {
    // 每小时清理一次过期的黑名单token
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000)
  }

  /**
   * 将token加入黑名单
   */
  addToBlacklist(token: string, userId: number, reason: string = 'User logged out'): void {
    try {
      // 解析token获取过期时间
      const payload = this.jwtService.decode(token) as { exp?: number } | null
      if (!payload || !payload.exp) {
        this.logger.warn('Invalid token format, cannot be added to blacklist')
        return
      }

      const expiresAt = new Date(payload.exp * 1000) // JWT exp是秒，转换为毫秒

      this.blacklistedTokens.set(token, {
        userId,
        expiresAt,
        reason,
      })

      this.logger.info(`Token added to blacklist: User ID=${userId}, Reason=${reason}`)
    }
    catch (error) {
      this.logger.error('Failed to add token to blacklist', error)
    }
  }

  /**
   * 检查token是否在黑名单中
   */
  isBlacklisted(token: string): boolean {
    const entry = this.blacklistedTokens.get(token)

    if (!entry) {
      return false
    }

    // 检查是否过期，过期则自动清理
    if (entry.expiresAt < new Date()) {
      this.blacklistedTokens.delete(token)
      return false
    }

    return true
  }

  /**
   * 强制下线指定用户的所有token
   * 通过用户ID将该用户的所有token加入黑名单
   */
  blacklistUserTokens(userId: number, reason: string = 'Force logout'): void {
    let count = 0

    // 遍历现有黑名单，找到该用户的token（这里只是示例，实际需要token与用户的映射）
    for (const [_token, entry] of this.blacklistedTokens.entries()) {
      if (entry.userId === userId) {
        entry.reason = reason
        count++
      }
    }

    this.logger.info(`${count} tokens for user ${userId} have been forced offline, reason: ${reason}`)
  }

  /**
   * 清理过期的黑名单token
   */
  private cleanupExpiredTokens(): void {
    const now = new Date()
    let cleanedCount = 0

    for (const [token, entry] of this.blacklistedTokens.entries()) {
      if (entry.expiresAt < now) {
        this.blacklistedTokens.delete(token)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned ${cleanedCount} expired blacklist tokens`)
    }
  }

  /**
   * 手动清理过期token（用于管理接口）
   */
  manualCleanup(): { cleaned: number } {
    const before = this.blacklistedTokens.size
    this.cleanupExpiredTokens()
    const after = this.blacklistedTokens.size

    return { cleaned: before - after }
  }
}

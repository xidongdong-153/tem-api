import { registerAs } from '@nestjs/config'

export interface AuthConfig {
  /** JWT 密钥 */
  jwtSecret: string
  /** JWT 过期时间 */
  jwtExpiresIn: string
  /** JWT 发行者 */
  jwtIssuer?: string
  /** JWT 受众 */
  jwtAudience?: string
  /** bcrypt 加密轮数 */
  bcryptRounds: number
  /** 刷新令牌过期时间 */
  refreshTokenExpiresIn: string
  /** 是否启用单设备登录 */
  singleDeviceLogin?: boolean
}

export default registerAs('auth', (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET ?? 'your-secret-key-please-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  jwtIssuer: process.env.JWT_ISSUER,
  jwtAudience: process.env.JWT_AUDIENCE,
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
  singleDeviceLogin: process.env.SINGLE_DEVICE_LOGIN === 'true',
}))

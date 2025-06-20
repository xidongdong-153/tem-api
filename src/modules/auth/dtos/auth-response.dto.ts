import { ApiProperty } from '@nestjs/swagger'

/**
 * 认证响应DTO - 登录成功后的返回数据
 * 遵循单一职责原则：只负责认证相关的响应数据
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string

  @ApiProperty({
    description: '令牌类型',
    example: 'Bearer',
  })
  tokenType: string = 'Bearer'

  @ApiProperty({
    description: '令牌过期时间（秒）',
    example: 86400,
  })
  expiresIn!: number
}

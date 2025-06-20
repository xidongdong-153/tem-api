import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

/**
 * 登录DTO - 最简化版本
 * 遵循KISS原则：保持简单，只包含必需字段
 */
export class LoginDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'john@example.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  password!: string
}

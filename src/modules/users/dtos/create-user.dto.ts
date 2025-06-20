import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator'

/**
 * 创建用户DTO - 最简化版本
 */
export class CreateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 50, { message: '用户名长度必须在3-50个字符之间' })
  username!: string

  @ApiProperty({
    description: '邮箱地址',
    example: 'john@example.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string

  @ApiProperty({
    description: '用户昵称',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 100, { message: '昵称长度不能超过100个字符' })
  nickname?: string
}

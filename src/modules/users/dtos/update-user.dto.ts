import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator'

/**
 * 更新用户DTO - 支持部分字段更新
 */
export class UpdateUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe_updated',
    minLength: 3,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 50, { message: '用户名长度必须在3-50个字符之间' })
  username?: string

  @ApiProperty({
    description: '邮箱地址',
    example: 'newemail@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string

  @ApiProperty({
    description: '用户昵称',
    example: 'John Doe Updated',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 100, { message: '昵称长度不能超过100个字符' })
  nickname?: string

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Length(11, 20, { message: '手机号长度必须在11-20个字符之间' })
  phone?: string

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '头像URL必须是字符串' })
  avatar?: string

  @ApiProperty({
    description: '是否启用',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '是否启用必须是布尔值' })
  isActive?: boolean
}

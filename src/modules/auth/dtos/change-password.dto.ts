import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { IsStrongPassword, Match } from '../decorators'

/**
 * 修改密码DTO
 * 遵循安全原则：验证旧密码，确保新密码强度
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'oldPassword123',
  })
  @IsNotEmpty({ message: '当前密码不能为空' })
  @IsString({ message: '当前密码必须是字符串' })
  currentPassword!: string

  @ApiProperty({
    description: '新密码（至少8位，包含数字和字母）',
    example: 'newPassword123',
    minLength: 8,
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度至少8位' })
  @IsStrongPassword({ message: '密码必须至少8位，且包含数字和字母' })
  newPassword!: string

  @ApiProperty({
    description: '确认新密码',
    example: 'newPassword123',
  })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsString({ message: '确认密码必须是字符串' })
  @Match('newPassword', { message: '两次输入的密码不一致' })
  confirmPassword!: string
}

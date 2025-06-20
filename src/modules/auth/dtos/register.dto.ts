import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'
import { CreateUserDto } from '../../users/dtos/create-user.dto'

/**
 * 注册DTO - 继承CreateUserDto并添加密码
 * 遵循DRY原则：复用现有的用户创建逻辑
 */
export class RegisterDto extends CreateUserDto {
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

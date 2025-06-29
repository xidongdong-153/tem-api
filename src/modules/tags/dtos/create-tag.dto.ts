import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateTagDto {
  @ApiProperty({
    description: '标签名称',
    example: '标签名称',
    required: true,
  })
  @IsNotEmpty({ message: '标签名称不能为空' })
  @IsString({ message: '标签名称必须是字符串' })
  name!: string
}

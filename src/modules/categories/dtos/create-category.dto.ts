import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateCategoryDto {
  @ApiProperty({
    description: '分类名称',
    example: '技术',
  })
  @IsNotEmpty({ message: '分类名称不能为空' })
  @IsString({ message: '分类名称必须是字符串' })
  name!: string

  @ApiProperty({
    description: '分类描述',
    example: '技术分类',
  })
  @IsNotEmpty({ message: '分类描述不能为空' })
  @IsString({ message: '分类描述必须是字符串' })
  description!: string
}

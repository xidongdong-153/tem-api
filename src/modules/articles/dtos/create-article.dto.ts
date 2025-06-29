import { ApiProperty } from '@nestjs/swagger'
import { Exclude } from 'class-transformer'
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateArticleDto {
  @ApiProperty({
    description: '文章标题',
    example: '如何使用MikroORM实现文章管理系统',
  })
  @IsNotEmpty({ message: '文章标题不能为空' })
  @IsString({ message: '文章标题必须是字符串' })
  title!: string

  @ApiProperty({
    description: '文章内容',
    example: '这是一篇关于MikroORM使用的详细教程...',
  })
  @IsNotEmpty({ message: '文章内容不能为空' })
  @IsString({ message: '文章内容必须是字符串' })
  content!: string

  @ApiProperty({
    description: '文章摘要',
    example: '本文介绍了如何使用MikroORM进行文章管理',
  })
  @IsNotEmpty({ message: '文章摘要不能为空' })
  @IsString({ message: '文章摘要必须是字符串' })
  summary!: string

  @ApiProperty({
    description: '文章分类ID',
    example: 1,
  })
  @IsNotEmpty({ message: '文章分类不能为空' })
  @IsNumber({}, { message: '分类ID必须是数字' })
  categoryId!: number

  @ApiProperty({
    description: '文章标签ID数组',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: '标签必须是数组' })
  @IsNumber({}, { each: true, message: '标签ID必须是数字' })
  @Exclude({ toPlainOnly: true })
  tagIds?: number[]
}

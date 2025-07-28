import { ApiPropertyOptional } from '@nestjs/swagger'
import { PaginationQueryDto } from '@shared/dtos'
import { Transform, Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { ArticleStatus } from '../entities/article.entity'

/**
 * 文章分页查询DTO
 * 继承通用分页查询，增加文章特有的过滤条件
 */
export class ListArticlesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: '作者ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '作者ID必须是整数' })
  authorId?: number

  @ApiPropertyOptional({
    description: '分类ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '分类ID必须是整数' })
  categoryId?: number

  @ApiPropertyOptional({
    description: '标签ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '标签ID必须是整数' })
  tagId?: number

  @ApiPropertyOptional({
    description: '文章状态',
    enum: ArticleStatus,
    example: ArticleStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(ArticleStatus, { message: '文章状态必须是有效的枚举值' })
  status?: ArticleStatus

  @ApiPropertyOptional({
    description: '标题关键词搜索',
    example: 'Vue.js',
  })
  @IsOptional()
  @IsString({ message: '标题关键词必须是字符串' })
  @Transform(({ value }) => value?.trim())
  title?: string

  @ApiPropertyOptional({
    description: '内容关键词搜索',
    example: 'JavaScript',
  })
  @IsOptional()
  @IsString({ message: '内容关键词必须是字符串' })
  @Transform(({ value }) => value?.trim())
  content?: string
}

import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

/**
 * 分页查询DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '页码',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码不能小于1' })
  page: number = 1

  @ApiPropertyOptional({
    description: '每页数量',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  limit: number = 10

  @ApiPropertyOptional({
    description: '搜索关键词（用户名或昵称）',
    example: 'john',
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  @Transform(({ value }) => value?.trim())
  search?: string

  @ApiPropertyOptional({
    description: '排序字段',
    example: 'createdAt',
    enum: ['id', 'username', 'createdAt', 'updatedAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy: string = 'createdAt'

  @ApiPropertyOptional({
    description: '排序方向',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString({ message: '排序方向必须是字符串' })
  @Transform(({ value }) => value?.toUpperCase())
  order: 'ASC' | 'DESC' = 'DESC'
}

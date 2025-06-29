import type { FilterQuery, FindOptions, QueryOrderMap } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/core'
import { PaginationQueryDto } from '@shared/dtos'
import { BasePaginationOptions, PaginationOptions, PaginationResult, PaginationResultWithRelations } from '../types'

/**
 * 基础Repository类
 * 提供通用的分页查询功能，支持关联查询
 */
export abstract class BaseRepository<Entity extends object> extends EntityRepository<Entity> {
  /**
   * 统一分页查询方法
   * 支持基础分页和关联查询分页，通过可选参数控制
   * @param query 分页查询参数
   * @param searchOptions 查询选项，可选择是否包含关联配置
   * @returns 分页查询结果
   */
  // 重载1：基础分页查询（不含关联）
  async findPaginated(
    query: PaginationQueryDto,
    searchOptions?: BasePaginationOptions<Entity>,
  ): Promise<PaginationResult<Entity>>

  // 重载2：带关联查询的分页（含关联配置）
  async findPaginated<Hint extends string = never>(
    query: PaginationQueryDto,
    searchOptions: PaginationOptions<Entity, Hint>,
  ): Promise<PaginationResultWithRelations<Entity, Hint>>

  // 实现方法
  async findPaginated<Hint extends string = never>(
    query: PaginationQueryDto,
    searchOptions: BasePaginationOptions<Entity> & {
      populate?: string[] | boolean
      strategy?: 'select-in' | 'joined'
    } = {},
  ): Promise<PaginationResult<Entity> | PaginationResultWithRelations<Entity, Hint>> {
    const { page, limit, sortBy, order } = query
    const { where = {}, options = {}, orderBy, populate, strategy } = searchOptions

    // 计算偏移量
    const offset = (page - 1) * limit

    // 构建排序条件，优先使用传入的orderBy，否则使用查询参数中的排序
    let finalOrderBy: QueryOrderMap<Entity> | undefined = orderBy

    if (!finalOrderBy && sortBy) {
      // 验证排序字段是否存在于实体中
      const entityMeta = this.getEntityManager().getMetadata().get(this.entityName)
      const validFields = Object.keys(entityMeta.properties)

      if (validFields.includes(sortBy)) {
        finalOrderBy = { [sortBy]: order } as QueryOrderMap<Entity>
      }
    }

    // 构建查询选项
    const findOptions: FindOptions<Entity> = {
      limit,
      offset,
    }

    if (finalOrderBy) {
      findOptions.orderBy = finalOrderBy
    }

    // 添加关联查询配置（如果提供）
    if (populate) {
      if (Array.isArray(populate)) {
        // 验证关联字段
        const validRelations = populate.filter(relation => this.isValidRelation(relation))

        if (validRelations.length > 0) {
          Object.assign(findOptions, { populate: validRelations })
        }
      }
      else {
        Object.assign(findOptions, { populate })
      }
    }

    if (strategy) {
      Object.assign(findOptions, { strategy })
    }

    // 合并额外的查询选项
    Object.assign(findOptions, options)

    // 查询数据和总数
    const [data, total] = await this.findAndCount(where as FilterQuery<Entity>, findOptions)

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)

    return {
      data: data as Entity[],
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * 验证关联字段是否存在的辅助方法
   * @param relationPath 关联路径
   * @returns 是否有效
   */
  protected isValidRelation(relationPath: string): boolean {
    try {
      const entityMeta = this.getEntityManager().getMetadata().get(this.entityName)
      const [rootField] = relationPath.split('.')

      return rootField in entityMeta.properties
    }
    catch {
      return false
    }
  }
}

import type { AutoPath, FilterQuery, FindOptions, Loaded, PopulatePath, QueryOrderMap } from '@mikro-orm/core'

/**
 * 分页查询结果接口
 */
export interface PaginationResult<T> {
  /** 数据列表 */
  data: T[]
  /** 分页元信息 */
  meta: {
    /** 当前页码 */
    page: number
    /** 每页数量 */
    limit: number
    /** 总记录数 */
    total: number
    /** 总页数 */
    totalPages: number
  }
}

/**
 * 基础分页查询选项接口
 */
export interface BasePaginationOptions<T> {
  /** 搜索条件 */
  where?: FilterQuery<T>
  /** 查询选项（不包括分页和排序相关） */
  options?: Omit<FindOptions<T>, 'limit' | 'offset' | 'orderBy' | 'populate'>
  /** 排序配置 */
  orderBy?: QueryOrderMap<T>
}

/**
 * 带关联查询的分页选项接口
 */
export interface PaginationOptions<T, Hint extends string = never> extends BasePaginationOptions<T> {
  /** 预加载关联数据 */
  populate?: AutoPath<T, Hint, PopulatePath.ALL>[] | boolean
  /** 关联查询策略 */
  strategy?: 'select-in' | 'joined'
}

/**
 * 带关联查询的分页结果接口
 */
export interface PaginationResultWithRelations<T, Hint extends string = never> {
  /** 数据列表 */
  data: Loaded<T, Hint>[]
  /** 分页元信息 */
  meta: {
    /** 当前页码 */
    page: number
    /** 每页数量 */
    limit: number
    /** 总记录数 */
    total: number
    /** 总页数 */
    totalPages: number
  }
}

/**
 * 关联查询配置接口
 */
export interface RelationConfig {
  /** 关联字段名 */
  field: string
  /** 是否必须加载 */
  required?: boolean
  /** 嵌套关联 */
  nested?: RelationConfig[]
  /** 关联查询条件 */
  where?: Record<string, unknown>
}

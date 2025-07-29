import type { ArticleEntity } from '@modules/articles'
import { Cascade, Collection, Entity, EntityRepositoryType, OneToMany, Property } from '@mikro-orm/core'
import { BaseEntity } from '@modules/database'
import { Expose } from 'class-transformer'
import { CategoryRepository } from '../repositories'

/**
 * 分类实体
 */
@Entity({ tableName: 'categories', repository: () => CategoryRepository })
export class CategoryEntity extends BaseEntity {
  [EntityRepositoryType]?: CategoryRepository

  @Property({ length: 100, comment: '分类名称' })
  name!: string

  @Property({ type: 'text', comment: '分类描述' })
  description!: string

  @Property({ default: 0, comment: '排序' })
  sortOrder!: number

  /**
   * 文章 - 分类关联的文章
   * 级联持久化：创建分类时可以同时创建文章
   * 不使用orphanRemoval：删除分类不会删除文章（保留历史数据）
   */
  @OneToMany('ArticleEntity', 'category', {
    cascade: [Cascade.PERSIST],
    orphanRemoval: false,
  })
  @Expose({ groups: ['category'] })
  articles = new Collection<ArticleEntity>(this)
}

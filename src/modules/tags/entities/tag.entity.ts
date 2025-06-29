import type { ArticleEntity } from '@modules/articles'
import { Cascade, Collection, Entity, EntityRepositoryType, ManyToMany, Property } from '@mikro-orm/core'
import { BaseEntity } from '@modules/database'
import { Exclude } from 'class-transformer'
import { TagRepository } from '../repositories'

/**
 * 标签实体
 */
@Entity({ tableName: 'tags', repository: () => TagRepository })
export class TagEntity extends BaseEntity {
  [EntityRepositoryType]?: TagRepository

  @Property({ length: 50, unique: true, comment: '标签名称' })
  name!: string

  @Property({ default: 0, comment: '使用次数' })
  usageCount!: number

  /**
   * 文章 - 标签关联的文章
   * 级联策略：当标签被移除时，不影响文章存在
   */
  @ManyToMany('ArticleEntity', 'tags', {
    cascade: [Cascade.PERSIST, Cascade.MERGE],
  })
  @Exclude()
  articles = new Collection<ArticleEntity>(this)
}

import type { CategoryEntity } from '@modules/categories'
import type { UserEntity } from '@modules/users'
import { Cascade, Collection, Entity, EntityRepositoryType, Enum, Index, ManyToMany, ManyToOne, Property } from '@mikro-orm/core'
import { BaseEntity } from '@modules/database'
import { TagEntity } from '@modules/tags'
import { ArticleRepository } from '../repositories/article.repository'

/**
 * 文章状态枚举
 */
export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 文章实体
 */
@Entity({ tableName: 'articles', repository: () => ArticleRepository })
export class ArticleEntity extends BaseEntity {
  [EntityRepositoryType]?: ArticleRepository

  @Index()
  @Property({ length: 200, comment: '文章标题' })
  title!: string

  @Property({ type: 'text', comment: '文章内容' })
  content!: string

  @Property({ type: 'text', comment: '文章摘要' })
  summary!: string

  @Index()
  @Enum(() => ArticleStatus)
  @Property({ default: ArticleStatus.DRAFT, comment: '文章状态' })
  status: ArticleStatus = ArticleStatus.DRAFT

  @Index()
  @Property({ nullable: true, comment: '发布时间' })
  publishedAt?: Date

  /**
   * 作者 - 文章作者
   * 设为可选以处理用户删除的情况
   */
  @ManyToOne('UserEntity', {
    lazy: true,
    nullable: true,
    deleteRule: 'set null',
  })
  author?: UserEntity

  /**
   * 分类 - 文章分类
   * 设为可选以处理分类删除的情况
   */
  @ManyToOne('CategoryEntity', {
    lazy: true,
    nullable: true,
    deleteRule: 'set null',
  })
  category?: CategoryEntity

  /**
   * 标签 - 文章标签
   * 支持级联持久化新标签
   */
  @ManyToMany(() => TagEntity, tag => tag.articles, {
    owner: true,
    lazy: true,
    cascade: [Cascade.PERSIST, Cascade.MERGE],
  })
  tags = new Collection<TagEntity>(this)
}

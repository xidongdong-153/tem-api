import { Cascade, Collection, Entity, EntityRepositoryType, Index, OneToMany, Property } from '@mikro-orm/core'
import { ArticleEntity } from '@modules/articles'
import { BaseEntity } from '@modules/database'
import { Exclude, Expose } from 'class-transformer'
import { UserRepository } from '../repositories/user.repository'

/**
 * 用户实体 - 支持多种登录方式、状态管理与扩展信息
 */
@Entity({ tableName: 'users', repository: () => UserRepository })
export class UserEntity extends BaseEntity {
  [EntityRepositoryType]?: UserRepository

  /**
   * 用户名 - 可用于登录，要求唯一
   */
  @Index()
  @Property({ length: 50, unique: true })
  username!: string

  /**
   * 邮箱地址 - 用于登录或找回密码，唯一
   */
  @Index()
  @Property({ length: 100, unique: true })
  email!: string

  /**
   * 手机号 - 可选登录方式，唯一
   */
  @Index()
  @Property({ length: 20, nullable: true, unique: true })
  phone?: string

  /**
   * 密码哈希值 - 存储加密后的密码（不能存明文）
   */
  @Property({ length: 100 })
  @Exclude()
  passwordHash!: string

  /**
   * 昵称 - 用户展示名，可选
   */
  @Property({ length: 100, nullable: true })
  nickname?: string

  /**
   * 头像 URL - 用户头像地址
   */
  @Property({ nullable: true })
  avatar?: string

  /**
   * 是否启用 - 控制账号是否可用
   */
  @Index()
  @Property({ default: true })
  isActive: boolean = true

  /**
   * 最近登录时间 - 可用于统计活跃度或异常检测
   */
  @Property({ nullable: true })
  lastLoginAt?: Date

  /**
   * 最近登录 IP - 安全审计用途
   */
  @Property({ nullable: true })
  @Exclude()
  lastLoginIp?: string

  /**
   * 文章 - 用户发布的文章
   * 级联持久化：创建用户时可以同时创建文章
   * 不使用orphanRemoval：删除用户不会删除文章（保留历史数据）
   */
  @OneToMany(() => ArticleEntity, article => article.author, {
    cascade: [Cascade.PERSIST],
    orphanRemoval: false,
  })
  @Expose({ groups: ['profile'] })
  articles = new Collection<ArticleEntity>(this)
}

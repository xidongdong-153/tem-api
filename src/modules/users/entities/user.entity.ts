import { Entity, EntityRepositoryType, Property, Unique } from '@mikro-orm/core'
import { BaseEntity } from '../../database/entities'
import { UserRepository } from '../repositories/user.repository'

/**
 * 用户实体 - 支持多种登录方式、状态管理与扩展信息
 */
@Entity({ tableName: 'users', repository: () => UserRepository })
export class User extends BaseEntity {
  [EntityRepositoryType]?: UserRepository

  /**
   * 用户名 - 可用于登录，要求唯一
   */
  @Property({ length: 50 })
  @Unique()
  username!: string

  /**
   * 邮箱地址 - 用于登录或找回密码，唯一
   */
  @Property({ length: 100 })
  @Unique()
  email!: string

  /**
   * 手机号 - 可选登录方式，唯一
   */
  @Property({ length: 20, nullable: true })
  @Unique()
  phone?: string

  /**
   * 密码哈希值 - 存储加密后的密码（不能存明文）
   */
  @Property({ length: 100, default: 'temp_password_hash' })
  passwordHash: string = 'temp_password_hash'

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
  @Property({ default: true })
  isActive: boolean = true

  /**
   * 是否逻辑删除 - 可用于软删除（隐藏数据但不物理删除）
   */
  @Property({ default: false })
  isDeleted: boolean = false

  /**
   * 最近登录时间 - 可用于统计活跃度或异常检测
   */
  @Property({ nullable: true })
  lastLoginAt?: Date

  /**
   * 最近登录 IP - 安全审计用途
   */
  @Property({ nullable: true })
  lastLoginIp?: string
}

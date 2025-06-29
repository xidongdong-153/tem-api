import {
  Entity,
  BaseEntity as MikroBaseEntity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'

/**
 * 所有实体通用的基础类
 * 使用数据库层面的时间戳管理，避免冗余设置
 */
@Entity({ abstract: true })
export abstract class BaseEntity extends MikroBaseEntity {
  @PrimaryKey()
  id!: number

  /**
   * 创建时间 - 由数据库自动设置
   */
  @Property({
    type: 'timestamptz',
    defaultRaw: 'now()',
    onCreate: () => new Date(),
  })
  createdAt!: Date

  /**
   * 更新时间 - 创建时和每次更新时都由数据库自动设置
   */
  @Property({
    type: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date
}

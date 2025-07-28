import {
  Entity,
  Filter,
  BaseEntity as MikroBaseEntity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'

/**
 * 所有实体通用的基础类
 * 使用数据库层面的时间戳管理，避免冗余设置
 * 支持软删除功能
 */
@Entity({ abstract: true })
@Filter({
  name: 'softDelete',
  cond: { deletedAt: null },
  default: true,
})
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

  /**
   * 删除时间 - 软删除标记，null表示未删除
   */
  @Property({
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  deletedAt?: Date
}

import {
  BeforeCreate,
  BeforeUpdate,
  Entity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'

/**
 * 所有实体通用的基础类
 */
@Entity({ abstract: true })
export abstract class BaseEntity {
  @PrimaryKey()
  id!: number

  @Property({ type: 'datetime' })
  createdAt: Date = new Date()

  @Property({ type: 'datetime', onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @BeforeCreate()
  setCreationDate() {
    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  @BeforeUpdate()
  setUpdateDate() {
    this.updatedAt = new Date()
  }
}

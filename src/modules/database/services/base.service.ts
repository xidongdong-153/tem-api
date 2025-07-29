import type { FilterQuery } from '@mikro-orm/core'
import { LoggerService } from '@modules/logger'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { BaseEntity } from '../entities/base.entity'
import { BaseRepository } from '../repositories/base.repository'

/**
 * 基础服务类
 * 提供通用的软删除、恢复和硬删除操作，减少各个服务中的重复代码
 */
export abstract class BaseService<Entity extends BaseEntity> {
  protected readonly logger: LoggerService

  constructor(
    protected readonly repository: BaseRepository<Entity>,
    protected readonly loggerService: LoggerService,
  ) {
    this.logger = loggerService
  }

  /**
   * 根据ID查找实体（用于删除操作）
   * 子类可以重写此方法以添加特定的查找逻辑
   */
  protected async findEntityById(id: number): Promise<Entity> {
    const entity = await this.repository.findOne({ id } as FilterQuery<Entity>)
    if (!entity) {
      throw new NotFoundException(`${this.getEntityName()} does not exist`)
    }
    return entity
  }

  /**
   * 根据ID查找实体（包括已软删除的）
   * 用于恢复操作
   */
  protected async findEntityByIdIncludingDeleted(id: number): Promise<Entity> {
    const entity = await this.repository.findOne(
      { id } as FilterQuery<Entity>,
      { filters: { softDelete: false } },
    )
    if (!entity) {
      throw new NotFoundException(`${this.getEntityName()} does not exist`)
    }
    return entity
  }

  /**
   * 软删除实体
   * @param id 实体ID
   */
  async softDelete(id: number): Promise<void> {
    const entity = await this.findEntityById(id)

    await this.repository.softDelete(entity)
    this.logger.info(`${this.getEntityName()} ${this.getEntityDisplayName(entity)}(ID: ${entity.id}) has been soft deleted`)
  }

  /**
   * 恢复被软删除的实体
   * @param id 实体ID
   * @returns 恢复后的实体
   */
  async restore(id: number): Promise<Entity> {
    const entity = await this.findEntityByIdIncludingDeleted(id)

    if (!entity.deletedAt) {
      throw new ConflictException(`${this.getEntityName()} is not deleted`)
    }

    // 在恢复前检查是否会产生唯一性约束冲突
    await this.checkRestoreConflicts(entity)

    await this.repository.restore(entity)
    this.logger.info(`${this.getEntityName()} ${this.getEntityDisplayName(entity)}(ID: ${entity.id}) has been restored`)

    return entity
  }

  /**
   * 硬删除实体（真正从数据库中删除）
   * 注意：这个方法应该谨慎使用，建议只在特殊情况下使用
   * @param id 实体ID
   */
  async hardDelete(id: number): Promise<void> {
    const entity = await this.findEntityByIdIncludingDeleted(id)

    await this.repository.hardDelete(entity)
    this.logger.warn(`${this.getEntityName()} ${this.getEntityDisplayName(entity)}(ID: ${entity.id}) has been permanently deleted`)
  }

  /**
   * 批量软删除实体
   * @param ids 实体ID数组
   */
  async softDeleteMany(ids: number[]): Promise<void> {
    const entities = await Promise.all(
      ids.map(id => this.findEntityById(id)),
    )

    await this.repository.softDeleteMany(entities)
    this.logger.info(`${entities.length} ${this.getEntityName()}(s) have been soft deleted`)
  }

  /**
   * 批量恢复被软删除的实体
   * @param ids 实体ID数组
   * @returns 恢复后的实体数组
   */
  async restoreMany(ids: number[]): Promise<Entity[]> {
    const entities = await Promise.all(
      ids.map(id => this.findEntityByIdIncludingDeleted(id)),
    )

    // 检查是否有未删除的实体
    const notDeletedEntities = entities.filter(entity => !entity.deletedAt)
    if (notDeletedEntities.length > 0) {
      throw new ConflictException(`Some ${this.getEntityName()}(s) are not deleted`)
    }

    // 检查每个实体的恢复冲突
    for (const entity of entities) {
      await this.checkRestoreConflicts(entity)
    }

    await this.repository.restoreMany(entities)
    this.logger.info(`${entities.length} ${this.getEntityName()}(s) have been restored`)

    return entities
  }

  /**
   * 批量硬删除实体
   * @param ids 实体ID数组
   */
  async hardDeleteMany(ids: number[]): Promise<void> {
    const entities = await Promise.all(
      ids.map(id => this.findEntityByIdIncludingDeleted(id)),
    )

    await this.repository.hardDeleteMany(entities)
    this.logger.warn(`${entities.length} ${this.getEntityName()}(s) have been permanently deleted`)
  }

  /**
   * 检查恢复实体时是否会产生冲突
   * 子类应该重写此方法以实现特定的冲突检查逻辑
   * @param _entity 要恢复的实体
   */
  protected async checkRestoreConflicts(_entity: Entity): Promise<void> {
    // 默认实现：不进行任何检查
    // 子类可以重写此方法来实现特定的冲突检查
  }

  /**
   * 获取实体名称（用于日志和错误消息）
   * 子类应该重写此方法
   */
  protected abstract getEntityName(): string

  /**
   * 获取实体的显示名称（用于日志）
   * 子类可以重写此方法以提供更有意义的显示名称
   * 默认返回实体ID
   */
  protected getEntityDisplayName(entity: Entity): string {
    return entity.id.toString()
  }
}

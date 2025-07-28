import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateTagDto } from '../dtos'
import { TagEntity } from '../entities'
import { TagRepository } from '../repositories'

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name)

  constructor(private readonly tagRepository: TagRepository) {}

  async createTag(createTagDto: CreateTagDto) {
    return this.tagRepository.createTag(createTagDto)
  }

  async findTagByName(name: string) {
    return this.tagRepository.findTagByName(name)
  }

  async findAllTags() {
    return this.tagRepository.find({})
  }

  /**
   * 根据ID查找标签
   */
  async findById(id: number): Promise<TagEntity> {
    const tag = await this.tagRepository.findOne({ id })
    if (!tag) {
      throw new NotFoundException('Tag does not exist')
    }
    return tag
  }

  /**
   * 软删除标签
   */
  async softDelete(id: number): Promise<void> {
    const tag = await this.findById(id)
    
    await this.tagRepository.softDelete(tag)
    this.logger.log(`Tag ${tag.name}(ID: ${tag.id}) has been soft deleted`)
  }

  /**
   * 恢复被软删除的标签
   */
  async restore(id: number): Promise<TagEntity> {
    // 查找时需要禁用softDelete过滤器，才能找到被软删除的实体
    const tag = await this.tagRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!tag) {
      throw new NotFoundException('Tag does not exist')
    }

    if (!tag.deletedAt) {
      throw new ConflictException('Tag is not deleted')
    }

    await this.tagRepository.restore(tag)
    this.logger.log(`Tag ${tag.name}(ID: ${tag.id}) has been restored`)

    return tag
  }

  /**
   * 硬删除标签（真正从数据库中删除）
   * 注意：这个方法应该谨慎使用，建议只在特殊情况下使用
   */
  async hardDelete(id: number): Promise<void> {
    // 查找时需要禁用softDelete过滤器
    const tag = await this.tagRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!tag) {
      throw new NotFoundException('Tag does not exist')
    }

    await this.tagRepository.hardDelete(tag)
    this.logger.warn(`Tag ${tag.name}(ID: ${tag.id}) has been permanently deleted`)
  }
}

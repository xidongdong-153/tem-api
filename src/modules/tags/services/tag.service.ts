import { BaseService } from '@modules/database'
import { LoggerService } from '@modules/logger'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateTagDto } from '../dtos'
import { TagEntity } from '../entities'
import { TagRepository } from '../repositories'

@Injectable()
export class TagService extends BaseService<TagEntity> {
  constructor(
    private readonly tagRepository: TagRepository,
    protected readonly loggerService: LoggerService,
  ) {
    super(tagRepository, loggerService)
  }

  protected getEntityName(): string {
    return 'Tag'
  }

  protected getEntityDisplayName(entity: TagEntity): string {
    return entity.name
  }

  async createTag(createTagDto: CreateTagDto) {
    // 检查标签名称是否已存在（排除已软删除的标签）
    const existingTag = await this.tagRepository.checkTagExists(createTagDto.name)
    if (existingTag) {
      throw new ConflictException('Tag name already exists')
    }

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

  // 软删除、恢复、硬删除方法现在由 BaseService 提供
  // 如果需要特殊逻辑，可以重写这些方法
}

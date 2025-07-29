import { BaseRepository } from '@modules/database'
import { CreateTagDto } from '../dtos'
import { TagEntity } from '../entities'

export class TagRepository extends BaseRepository<TagEntity> {
  /**
   * 创建标签
   */
  async createTag(createTagDto: CreateTagDto) {
    const tag = this.create(createTagDto, { partial: true })
    await this.getEntityManager().persistAndFlush(tag)
    return tag
  }

  /**
   * 根据名称查找标签
   */
  async findTagByName(name: string) {
    return this.findOne({ name })
  }

  /**
   * 检查标签名称是否已存在（排除已软删除的标签）
   */
  async checkTagExists(name: string): Promise<TagEntity | null> {
    return this.findOne({
      name,
      deletedAt: null, // 只检查未删除的标签
    })
  }
}

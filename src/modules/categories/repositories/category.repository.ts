import { BaseRepository } from '@modules/database'
import { CreateCategoryDto } from '../dtos'
import { CategoryEntity } from '../entities'

export class CategoryRepository extends BaseRepository<CategoryEntity> {
  /**
   * 创建分类
   */
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    const category = this.create(createCategoryDto, { partial: true })
    await this.getEntityManager().persistAndFlush(category)
    return category
  }

  /**
   * 根据名称查找分类
   */
  async findCategoryByName(name: string): Promise<CategoryEntity | null> {
    // 测试 relation 是否正常
    return this.findOne({ name }, { populate: ['articles'] })
  }

  /**
   * 检查分类名称是否已存在（排除已软删除的分类）
   */
  async checkCategoryExists(name: string): Promise<CategoryEntity | null> {
    return this.findOne({
      name,
      deletedAt: null, // 只检查未删除的分类
    })
  }
}

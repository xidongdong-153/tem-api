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
}

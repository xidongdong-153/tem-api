import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateCategoryDto } from '../dtos'
import { CategoryEntity } from '../entities'
import { CategoryRepository } from '../repositories'

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name)

  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * 创建分类
   */
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    return this.categoryRepository.createCategory(createCategoryDto)
  }

  /**
   * 获取所有分类
   */
  async findAll(): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll()
  }

  /**
   * 根据名称查找分类
   */
  async findCategoryByName(name: string): Promise<CategoryEntity | null> {
    return this.categoryRepository.findCategoryByName(name)
  }

  /**
   * 根据ID查找分类
   */
  async findById(id: number): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne({ id })
    if (!category) {
      throw new NotFoundException('Category does not exist')
    }
    return category
  }

  /**
   * 软删除分类
   */
  async softDelete(id: number): Promise<void> {
    const category = await this.findById(id)
    
    await this.categoryRepository.softDelete(category)
    this.logger.log(`Category ${category.name}(ID: ${category.id}) has been soft deleted`)
  }

  /**
   * 恢复被软删除的分类
   */
  async restore(id: number): Promise<CategoryEntity> {
    // 查找时需要禁用softDelete过滤器，才能找到被软删除的实体
    const category = await this.categoryRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!category) {
      throw new NotFoundException('Category does not exist')
    }

    if (!category.deletedAt) {
      throw new ConflictException('Category is not deleted')
    }

    await this.categoryRepository.restore(category)
    this.logger.log(`Category ${category.name}(ID: ${category.id}) has been restored`)

    return category
  }

  /**
   * 硬删除分类（真正从数据库中删除）
   * 注意：这个方法应该谨慎使用，建议只在特殊情况下使用
   */
  async hardDelete(id: number): Promise<void> {
    // 查找时需要禁用softDelete过滤器
    const category = await this.categoryRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!category) {
      throw new NotFoundException('Category does not exist')
    }

    await this.categoryRepository.hardDelete(category)
    this.logger.warn(`Category ${category.name}(ID: ${category.id}) has been permanently deleted`)
  }
}

import { BaseService } from '@modules/database'
import { LoggerService } from '@modules/logger'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { CreateCategoryDto } from '../dtos'
import { CategoryEntity } from '../entities'
import { CategoryRepository } from '../repositories'

@Injectable()
export class CategoryService extends BaseService<CategoryEntity> {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    protected readonly loggerService: LoggerService,
  ) {
    super(categoryRepository, loggerService)
  }

  /**
   * 创建分类
   */
  async createCategory(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    // 检查分类名称是否已存在（排除已软删除的分类）
    const existingCategory = await this.categoryRepository.checkCategoryExists(createCategoryDto.name)
    if (existingCategory) {
      throw new ConflictException('Category name already exists')
    }

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
   * 获取实体名称（用于日志和错误消息）
   */
  protected getEntityName(): string {
    return 'Category'
  }

  /**
   * 获取实体的显示名称（用于日志）
   */
  protected getEntityDisplayName(entity: CategoryEntity): string {
    return entity.name
  }

  /**
   * 检查恢复分类时是否会产生唯一性冲突
   * @param entity 要恢复的分类实体
   */
  protected async checkRestoreConflicts(entity: CategoryEntity): Promise<void> {
    // 检查是否存在同名且未删除的分类
    const existingCategory = await this.categoryRepository.checkCategoryExists(entity.name)
    if (existingCategory) {
      throw new ConflictException(`Category name '${entity.name}' already exists. Cannot restore this category.`)
    }
  }
}

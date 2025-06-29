import { Injectable } from '@nestjs/common'
import { CreateCategoryDto } from '../dtos'
import { CategoryEntity } from '../entities'
import { CategoryRepository } from '../repositories'

@Injectable()
export class CategoryService {
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
}

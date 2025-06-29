import { UserEntity } from '@modules/users/entities'
import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateArticleDto, UpdateArticleDto } from '../dtos'
import { ArticleEntity } from '../entities'
import { ArticleRepository } from '../repositories/article.repository'

@Injectable()
export class ArticleService {
  constructor(
    private readonly articleRepository: ArticleRepository,
  ) {}

  /**
   * 创建文章
   * @param createArticleDto 创建文章的数据传输对象
   * @param author 当前登录的用户（作为文章作者）
   * @returns 创建的文章实体
   */
  async createArticle(createArticleDto: CreateArticleDto, author: UserEntity): Promise<ArticleEntity> {
    try {
      // 检查文章标题是否已存在
      const existingArticle = await this.articleRepository.findByTitle(createArticleDto.title)
      if (existingArticle) {
        throw new Error('Article with this title already exists')
      }

      // 通过Repository创建文章
      return await this.articleRepository.createArticle(createArticleDto, author)
    }
    catch (error) {
      // 统一处理错误
      if (error instanceof Error) {
        throw new TypeError(`Failed to create article: ${error.message}`)
      }
      throw new Error('Failed to create article due to unknown error')
    }
  }

  /**
   * 根据文章标题查找文章
   */
  async findByTitle(title: string): Promise<ArticleEntity | null> {
    return this.articleRepository.findByTitle(title)
  }

  /**
   * 根据ID查找文章，包含关联数据
   * @param id 文章ID
   * @returns 包含关联数据的文章实体
   */
  async findOneWithRelations(id: number): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOneWithRelations(id)
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`)
    }

    return article
  }

  async updateArticle(id: number, updateArticleDto: UpdateArticleDto): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOneWithRelations(id)

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`)
    }

    return this.articleRepository.updateArticle(article, updateArticleDto)
  }
}

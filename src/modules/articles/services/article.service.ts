import { UserEntity } from '@modules/users/entities'
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateArticleDto, ListArticlesDto, UpdateArticleDto } from '../dtos'
import { ArticleEntity } from '../entities'
import { ArticleRepository } from '../repositories/article.repository'

@Injectable()
export class ArticleService {
  private readonly logger = new Logger(ArticleService.name)

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

  /**
   * 分页查询文章列表
   * @param listDto 分页查询参数
   * @returns 分页查询结果
   */
  async findPaginated(listDto: ListArticlesDto) {
    return this.articleRepository.findArticlesPaginated(listDto)
  }

  /**
   * 根据ID查找文章（用于删除操作）
   */
  async findById(id: number): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({ id })
    if (!article) {
      throw new NotFoundException('Article does not exist')
    }
    return article
  }

  /**
   * 软删除文章
   */
  async softDelete(id: number): Promise<void> {
    const article = await this.findById(id)
    
    await this.articleRepository.softDelete(article)
    this.logger.log(`Article ${article.title}(ID: ${article.id}) has been soft deleted`)
  }

  /**
   * 恢复被软删除的文章
   */
  async restore(id: number): Promise<ArticleEntity> {
    // 查找时需要禁用softDelete过滤器，才能找到被软删除的实体
    const article = await this.articleRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!article) {
      throw new NotFoundException('Article does not exist')
    }

    if (!article.deletedAt) {
      throw new ConflictException('Article is not deleted')
    }

    await this.articleRepository.restore(article)
    this.logger.log(`Article ${article.title}(ID: ${article.id}) has been restored`)

    return article
  }

  /**
   * 硬删除文章（真正从数据库中删除）
   * 注意：这个方法应该谨慎使用，建议只在特殊情况下使用
   */
  async hardDelete(id: number): Promise<void> {
    // 查找时需要禁用softDelete过滤器
    const article = await this.articleRepository.findOne(
      { id },
      { filters: { softDelete: false } },
    )

    if (!article) {
      throw new NotFoundException('Article does not exist')
    }

    await this.articleRepository.hardDelete(article)
    this.logger.warn(`Article ${article.title}(ID: ${article.id}) has been permanently deleted`)
  }
}

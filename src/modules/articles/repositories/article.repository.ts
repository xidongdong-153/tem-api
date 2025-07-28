import type { FilterQuery } from '@mikro-orm/core'
import { CategoryEntity } from '@modules/categories/entities'
import { BaseRepository } from '@modules/database'
import { TagEntity } from '@modules/tags/entities'
import { UserEntity } from '@modules/users/entities'
import { CreateArticleDto, ListArticlesDto, UpdateArticleDto } from '../dtos'
import { ArticleEntity } from '../entities/article.entity'

/**
 * 文章Repository
 */
export class ArticleRepository extends BaseRepository<ArticleEntity> {
  /**
   * 根据标题查找文章
   */
  async findByTitle(title: string): Promise<ArticleEntity | null> {
    return this.findOne({ title })
  }

  /**
   * 创建文章
   * @param createArticleDto 创建文章的数据
   * @param author 作者实体
   * @returns 创建的文章实体
   */
  async createArticle(createArticleDto: CreateArticleDto, author: UserEntity): Promise<ArticleEntity> {
    const em = this.getEntityManager()

    // 查找分类
    const category = await em.findOne(CategoryEntity, { id: createArticleDto.categoryId })
    if (!category) {
      throw new Error(`Category with ID ${createArticleDto.categoryId} not found`)
    }

    // 创建文章实体
    const article = new ArticleEntity()
    article.title = createArticleDto.title
    article.content = createArticleDto.content
    article.summary = createArticleDto.summary
    article.author = author
    article.category = category

    // 处理标签关联（如果提供了标签ID）
    if (createArticleDto.tagIds && createArticleDto.tagIds.length > 0) {
      const tags = await em.find(TagEntity, { id: { $in: createArticleDto.tagIds } })
      if (tags.length !== createArticleDto.tagIds.length) {
        throw new Error('One or more tag IDs are invalid')
      }

      // 先持久化文章以确保其ID存在，然后再设置标签关联
      await em.persistAndFlush(article)

      // 现在安全地设置标签关联
      article.tags.set(tags)
      await em.flush()
    }
    else {
      // 如果没有标签，直接持久化
      await em.persistAndFlush(article)
    }

    // 返回包含关联数据的文章
    const result = await em.findOne(ArticleEntity, { id: article.id }, {
      populate: ['author', 'category', 'tags'],
    })

    if (!result) {
      throw new Error('Failed to retrieve created article')
    }

    return result
  }

  /**
   * 查找文章，包含关联数据
   * @param id 文章ID
   * @returns 包含关联数据的文章实体
   */
  async findOneWithRelations(id: number): Promise<ArticleEntity | null> {
    return this.findOne({ id }, {
      populate: ['author', 'category', 'tags'],
    })
  }

  /**
   * 更新文章
   * @param article 文章实体
   * @param updateArticleDto 更新文章的数据传输对象
   * @returns 更新后的文章实体
   */
  async updateArticle(article: ArticleEntity, updateArticleDto: UpdateArticleDto): Promise<ArticleEntity> {
    const em = this.getEntityManager()

    // 处理分类更新
    if (updateArticleDto.categoryId && updateArticleDto.categoryId !== article.category?.id) {
      const category = await em.findOne(CategoryEntity, { id: updateArticleDto.categoryId })
      if (!category) {
        throw new Error(`Category with ID ${updateArticleDto.categoryId} not found`)
      }
      article.category = category
    }

    // 处理标签更新
    if (updateArticleDto.tagIds !== undefined) {
      if (updateArticleDto.tagIds.length > 0) {
        const tags = await em.find(TagEntity, { id: { $in: updateArticleDto.tagIds } })
        if (tags.length !== updateArticleDto.tagIds.length) {
          throw new Error('One or more tag IDs are invalid')
        }
        article.tags.set(tags)
      }
      else {
        // 如果 tagIds 为空数组，清除所有标签关联
        article.tags.removeAll()
      }
    }

    // 更新其他字段（排除 categoryId 和 tagIds）
    const { categoryId: _categoryId, tagIds: _tagIds, ...updateData } = updateArticleDto
    this.assign(article, updateData)

    await em.flush()
    return article
  }

  /**
   * 构建文章列表查询条件
   * @param listDto 分页查询参数
   * @returns 查询条件对象
   */
  buildListQuery(listDto: ListArticlesDto): FilterQuery<ArticleEntity> {
    const where: FilterQuery<ArticleEntity> = {}

    // 作者ID过滤
    if (listDto.authorId) {
      where.author = { id: listDto.authorId }
    }

    // 分类ID过滤
    if (listDto.categoryId) {
      where.category = { id: listDto.categoryId }
    }

    // 标签ID过滤
    if (listDto.tagId) {
      where.tags = { id: listDto.tagId }
    }

    // 状态过滤
    if (listDto.status) {
      where.status = listDto.status
    }

    // 标题搜索
    if (listDto.title) {
      where.title = { $ilike: `%${listDto.title}%` }
    }

    // 内容搜索
    if (listDto.content) {
      where.content = { $ilike: `%${listDto.content}%` }
    }

    // 通用搜索（搜索标题和内容）
    if (listDto.search) {
      where.$or = [
        { title: { $ilike: `%${listDto.search}%` } },
        { content: { $ilike: `%${listDto.search}%` } },
        { summary: { $ilike: `%${listDto.search}%` } },
      ]
    }

    return where
  }

  /**
   * 分页查询文章列表
   * @param listDto 分页查询参数
   * @returns 分页查询结果
   */
  async findArticlesPaginated(listDto: ListArticlesDto) {
    const where = this.buildListQuery(listDto)

    return this.findPaginated(listDto, {
      where,
      populate: ['author', 'category', 'tags'],
      strategy: 'select-in',
    })
  }
}

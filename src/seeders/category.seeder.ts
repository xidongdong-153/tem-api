import type { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'

import { CategoryEntity } from '@modules/categories/entities'
import { SeederLogger } from './utils/seeder-logger.util'

export class CategorySeeder extends Seeder {
  private readonly logger = new SeederLogger('CategorySeeder')

  async run(em: EntityManager): Promise<void> {
    // 检查是否已有数据
    const existingCount = await em.count(CategoryEntity)
    if (existingCount > 0) {
      this.logger.skip('分类', existingCount)
      return
    }

    const categories = [
      {
        name: '技术',
        description: '技术相关文章',
        sortOrder: 1,
      },
      {
        name: '生活',
        description: '生活感悟和经验分享',
        sortOrder: 2,
      },
      {
        name: '学习',
        description: '学习笔记和心得',
        sortOrder: 3,
      },
      {
        name: '随笔',
        description: '随想随写',
        sortOrder: 4,
      },
    ]

    for (const categoryData of categories) {
      const category = new CategoryEntity()
      Object.assign(category, categoryData)
      em.persist(category)
    }

    await em.flush()
    this.logger.success('分类', categories.length)
  }
}

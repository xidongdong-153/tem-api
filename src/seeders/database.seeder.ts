import type { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'

import { ArticleSeeder } from './article.seeder'
import { CategorySeeder } from './category.seeder'
import { TagSeeder } from './tag.seeder'
import { UserSeeder } from './user.seeder'
import { SeederLogger } from './utils/seeder-logger.util'

export class DatabaseSeeder extends Seeder {
  private readonly logger = new SeederLogger('DatabaseSeeder')

  async run(em: EntityManager): Promise<void> {
    this.logger.start('数据库种子数据填充')

    // 按依赖顺序执行 seeders
    // 1. 用户数据（独立）
    await this.call(em, [UserSeeder])

    // 2. 分类数据（独立）
    await this.call(em, [CategorySeeder])

    // 3. 标签数据（独立）
    await this.call(em, [TagSeeder])

    // 4. 文章数据（依赖用户、分类、标签）
    await this.call(em, [ArticleSeeder])

    this.logger.complete('数据库种子数据填充')
  }
}

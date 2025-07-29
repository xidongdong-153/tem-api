import type { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'

import { TagEntity } from '@modules/tags/entities'
import { SeederLogger } from './utils/seeder-logger.util'

export class TagSeeder extends Seeder {
  private readonly logger = new SeederLogger('TagSeeder')

  async run(em: EntityManager): Promise<void> {
    // 检查是否已有数据
    const existingCount = await em.count(TagEntity)
    if (existingCount > 0) {
      this.logger.skip('标签', existingCount)
      return
    }

    const tags = [
      { name: 'JavaScript', usageCount: 0 },
      { name: 'TypeScript', usageCount: 0 },
      { name: 'Node.js', usageCount: 0 },
      { name: 'React', usageCount: 0 },
      { name: 'Vue', usageCount: 0 },
      { name: 'Angular', usageCount: 0 },
      { name: 'CSS', usageCount: 0 },
      { name: 'HTML', usageCount: 0 },
      { name: 'Python', usageCount: 0 },
      { name: 'Java', usageCount: 0 },
      { name: 'Go', usageCount: 0 },
      { name: 'Rust', usageCount: 0 },
      { name: 'Docker', usageCount: 0 },
      { name: 'Kubernetes', usageCount: 0 },
      { name: 'AWS', usageCount: 0 },
      { name: 'DevOps', usageCount: 0 },
      { name: '前端', usageCount: 0 },
      { name: '后端', usageCount: 0 },
      { name: '全栈', usageCount: 0 },
      { name: '架构', usageCount: 0 },
    ]

    for (const tagData of tags) {
      const tag = new TagEntity()
      Object.assign(tag, tagData)
      em.persist(tag)
    }

    await em.flush()
    this.logger.success('标签', tags.length)
  }
}

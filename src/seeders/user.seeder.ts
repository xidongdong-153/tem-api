import type { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'

import { UserEntity } from '@modules/users/entities'

import * as bcrypt from 'bcrypt'

import { SeederLogger } from './utils/seeder-logger.util'

export class UserSeeder extends Seeder {
  private readonly logger = new SeederLogger('UserSeeder')

  async run(em: EntityManager): Promise<void> {
    // 检查是否已有数据
    const existingCount = await em.count(UserEntity)
    if (existingCount > 0) {
      this.logger.skip('用户', existingCount)
      return
    }

    const saltRounds = 10
    const defaultPassword = await bcrypt.hash('password123', saltRounds)

    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: defaultPassword,
        nickname: '管理员',
        avatar: 'https://via.placeholder.com/100x100?text=Admin',
        isActive: true,
      },
      {
        username: 'editor',
        email: 'editor@example.com',
        passwordHash: defaultPassword,
        nickname: '编辑',
        avatar: 'https://via.placeholder.com/100x100?text=Editor',
        isActive: true,
      },
      {
        username: 'author',
        email: 'author@example.com',
        passwordHash: defaultPassword,
        nickname: '作者',
        avatar: 'https://via.placeholder.com/100x100?text=Author',
        isActive: true,
      },
      {
        username: 'user',
        email: 'user@example.com',
        passwordHash: defaultPassword,
        nickname: '普通用户',
        avatar: 'https://via.placeholder.com/100x100?text=User',
        isActive: true,
      },
    ]

    for (const userData of users) {
      const user = new UserEntity()
      Object.assign(user, userData)
      em.persist(user)
    }

    await em.flush()
    this.logger.success('用户', users.length)
  }
}

import type { PaginationQueryDto } from '../dtos/pagination-query.dto'
import { EntityRepository } from '@mikro-orm/core'
import { Injectable } from '@nestjs/common'
import { User } from '../entities/user.entity'

@Injectable()
export class UserRepository extends EntityRepository<User> {
  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ username })
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email })
  }

  /**
   * 检查用户名或邮箱是否已存在
   */
  async checkUserExists(username: string, email: string): Promise<User | null> {
    return this.findOne({
      $or: [
        { username },
        { email },
      ],
    })
  }

  /**
   * 检查用户名或邮箱是否被其他用户使用（排除指定用户ID）
   */
  async checkUserExistsExcluding(
    username: string | undefined,
    email: string | undefined,
    excludeId: number,
  ): Promise<User | null> {
    const conditions: Array<{ username?: string, email?: string }> = []

    if (username) {
      conditions.push({ username })
    }
    if (email) {
      conditions.push({ email })
    }

    if (conditions.length === 0) {
      return null
    }

    return this.findOne({
      $or: conditions,
      id: { $ne: excludeId },
    })
  }

  /**
   * 获取所有活跃用户列表
   */
  async findAllActive(): Promise<User[]> {
    return this.find(
      { isActive: true, isDeleted: false },
      { orderBy: { createdAt: 'DESC' } },
    )
  }

  /**
   * 分页查询用户
   */
  async findPaginated(query: PaginationQueryDto) {
    const { page, limit, search, sortBy, order } = query

    // 构建查询条件
    const where: Record<string, unknown> = {
      isDeleted: false, // 默认不显示已删除的用户
    }

    if (search) {
      where.$or = [
        { username: { $like: `%${search}%` } },
        { nickname: { $like: `%${search}%` } },
      ]
    }

    // 计算偏移量
    const offset = (page - 1) * limit

    // 验证排序字段
    const validSortFields = ['id', 'username', 'createdAt', 'updatedAt']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'

    // 查询数据和总数
    const [users, total] = await this.findAndCount(where, {
      orderBy: { [sortField]: order },
      limit,
      offset,
    })

    // 计算分页信息
    const totalPages = Math.ceil(total / limit)

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  /**
   * 根据ID查找活跃用户（排除已删除的）
   */
  async findActiveById(id: number): Promise<User | null> {
    return this.findOne({
      id,
      isDeleted: false,
    })
  }

  /**
   * 软删除用户
   */
  async softDelete(user: User): Promise<void> {
    user.isActive = false
    user.isDeleted = true
    await this.getEntityManager().flush()
  }

  /**
   * 硬删除用户
   */
  async hardDelete(user: User): Promise<void> {
    await this.getEntityManager().removeAndFlush(user)
  }

  /**
   * 创建用户
   */
  async createUser(userData: {
    username: string
    email: string
    nickname?: string
  }): Promise<User> {
    const user = this.create({
      username: userData.username,
      email: userData.email,
      nickname: userData.nickname,
      passwordHash: 'temp_password_hash', // 临时密码，应该在后续流程中设置
    }, { partial: true })

    await this.getEntityManager().persistAndFlush(user)
    return user
  }

  /**
   * 更新用户信息
   */
  async updateUser(user: User, updateData: Partial<User>): Promise<User> {
    this.assign(user, updateData)
    await this.getEntityManager().flush()
    return user
  }

  /**
   * 更新用户密码
   * @param user 用户实体
   * @param passwordHash 新的密码哈希值
   */
  async updateUserPassword(user: User, passwordHash: string): Promise<User> {
    user.passwordHash = passwordHash
    await this.getEntityManager().flush()
    return user
  }
}

import { BaseRepository } from '@modules/database'
import { CreateUserDto, UpdateUserDto } from '../dtos'
import { UserEntity } from '../entities/user.entity'

/**
 * 用户Repository - 官方推荐的自定义Repository模式
 * 继承EntityRepository，不需要@Injectable装饰器
 * Repository会根据Entity的repository配置自动注册到DI容器
 */
export class UserRepository extends BaseRepository<UserEntity> {
  /**
   * 检查用户名或邮箱是否已存在
   */
  async checkUserExists(username: string, email: string): Promise<UserEntity | null> {
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
  ): Promise<UserEntity | null> {
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
  async findAllActive(): Promise<UserEntity[]> {
    return this.find(
      { isActive: true },
      { orderBy: { createdAt: 'DESC' } },
    )
  }

  /**
   * 根据ID查找活跃用户（排除已删除的）
   */
  async findActiveById(id: number): Promise<UserEntity | null> {
    return this.findOne({
      id,
    }, { populate: ['articles'] })
  }

  /**
   * 软删除用户（继承自 BaseRepository）
   * 同时设置为非活跃状态
   */
  async softDelete(user: UserEntity): Promise<void> {
    user.isActive = false
    await super.softDelete(user)
  }

  /**
   * 硬删除用户
   */
  async hardDelete(user: UserEntity): Promise<void> {
    await this.getEntityManager().removeAndFlush(user)
  }

  /**
   * 创建用户
   */
  async createUser(userData: CreateUserDto, passwordHash?: string): Promise<UserEntity> {
    const user = this.create(userData, { partial: true })

    if (passwordHash) {
      user.passwordHash = passwordHash
    }

    await this.getEntityManager().persistAndFlush(user)
    return user
  }

  /**
   * 更新用户信息
   */
  async updateUser(user: UserEntity, updateData: UpdateUserDto): Promise<UserEntity> {
    this.assign(user, updateData)
    await this.getEntityManager().flush()
    return user
  }

  /**
   * 更新用户密码
   * @param user 用户实体
   * @param passwordHash 新的密码哈希值
   */
  async updateUserPassword(user: UserEntity, passwordHash: string): Promise<UserEntity> {
    user.passwordHash = passwordHash
    await this.getEntityManager().flush()
    return user
  }
}

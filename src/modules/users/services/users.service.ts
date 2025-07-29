import type { FilterQuery } from '@mikro-orm/core'
import type { PaginationQueryDto } from '../../../shared/dtos'
import type { CreateUserDto } from '../dtos/create-user.dto'
import type { UpdateUserDto } from '../dtos/update-user.dto'

import { BaseService } from '@modules/database'
import { LoggerService } from '@modules/logger'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { UserEntity } from '../entities'
import { UserRepository } from '../repositories'

/**
 * 用户服务 - 使用 Repository 模式
 */
@Injectable()
export class UsersService extends BaseService<UserEntity> {
  constructor(
    private readonly userRepository: UserRepository,
    protected readonly loggerService: LoggerService,
  ) {
    super(userRepository, loggerService)
  }

  protected getEntityName(): string {
    return 'User'
  }

  protected getEntityDisplayName(entity: UserEntity): string {
    return entity.username
  }

  /**
   * 创建新用户
   */
  async create(createUserDto: CreateUserDto, passwordHash?: string): Promise<UserEntity> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.checkUserExists(
      createUserDto.username,
      createUserDto.email,
    )

    if (existingUser) {
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('Username already exists')
      }
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists')
      }
    }

    // 创建用户
    const user = await this.userRepository.createUser({
      username: createUserDto.username,
      email: createUserDto.email,
      nickname: createUserDto.nickname,
    }, passwordHash)

    this.logger.info(`User ${user.username}(ID: ${user.id}) created successfully`)

    return user
  }

  /**
   * 获取所有用户列表
   */
  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.findAllActive()
  }

  /**
   * 分页获取用户列表
   */
  async findPaginated(query: PaginationQueryDto) {
    // 构建搜索条件
    let whereConditions: FilterQuery<UserEntity> = {}

    // 如果有搜索关键词，则在多个字段中进行模糊搜索
    if (query.search && query.search.trim()) {
      const searchTerm = `%${query.search.trim()}%`
      whereConditions = {
        $or: [
          { username: { $like: searchTerm } },
          { email: { $like: searchTerm } },
          { nickname: { $like: searchTerm } },
          { phone: { $like: searchTerm } },
        ],
      }
    }

    return await this.userRepository.findPaginated(query, {
      where: whereConditions,
    })
  }

  /**
   * 根据ID查找用户
   */
  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findActiveById(id)

    if (!user) {
      throw new NotFoundException('User does not exist')
    }

    return user
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ email })
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id) // 复用查找逻辑

    // 检查用户名、邮箱和手机号是否已被其他用户使用
    if (updateUserDto.username || updateUserDto.email || updateUserDto.phone) {
      const existingUser = await this.userRepository.checkUserExistsExcluding(
        updateUserDto.username !== user.username ? updateUserDto.username : undefined,
        updateUserDto.email !== user.email ? updateUserDto.email : undefined,
        id,
        updateUserDto.phone !== user.phone ? updateUserDto.phone : undefined,
      )

      if (existingUser) {
        if (updateUserDto.username && existingUser.username === updateUserDto.username) {
          throw new ConflictException('Username already exists')
        }
        if (updateUserDto.email && existingUser.email === updateUserDto.email) {
          throw new ConflictException('Email already exists')
        }
        if (updateUserDto.phone && existingUser.phone === updateUserDto.phone) {
          throw new ConflictException('Phone number already exists')
        }
      }
    }

    // 更新用户信息
    const updatedUser = await this.userRepository.updateUser(user, updateUserDto)

    this.logger.info(`User ${updatedUser.username}(ID: ${updatedUser.id}) information updated`)

    return updatedUser
  }

  /**
   * 删除用户（软删除 - 设置为不活跃状态）
   */
  // 软删除、恢复、硬删除方法现在由 BaseService 提供
  // 如果需要特殊逻辑，可以重写这些方法

  /**
   * 重写恢复方法以处理用户特有的 isActive 状态
   */
  async restore(id: number): Promise<UserEntity> {
    const user = await super.restore(id)

    // 恢复用户的活跃状态
    user.isActive = true
    await this.userRepository.getEntityManager().flush()

    return user
  }

  // 为了保持向后兼容，保留原有的方法名
  async remove(id: number): Promise<void> {
    return this.softDelete(id)
  }

  async forceRemove(id: number): Promise<void> {
    return this.hardDelete(id)
  }

  /**
   * 更新用户密码
   * @param id 用户ID
   * @param passwordHash 新的密码哈希值
   */
  async updatePassword(id: number, passwordHash: string): Promise<UserEntity> {
    const user = await this.findOne(id)

    const updatedUser = await this.userRepository.updateUserPassword(user, passwordHash)

    this.logger.info(`User ${user.username}(ID: ${user.id}) password updated`)

    return updatedUser
  }
}

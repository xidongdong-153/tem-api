import type { CreateUserDto } from '../dtos/create-user.dto'
import type { PaginationQueryDto } from '../dtos/pagination-query.dto'
import type { UpdateUserDto } from '../dtos/update-user.dto'

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { LoggerService } from '../../logger'
import { User } from '../entities/user.entity'
import { UserRepository } from '../repositories'

/**
 * 用户服务 - 使用 Repository 模式
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly logger: LoggerService,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * 创建新用户
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
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
    })

    this.logger.info(`User ${user.username}(ID: ${user.id}) created successfully`)

    return user
  }

  /**
   * 获取所有用户列表
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.findAllActive()
  }

  /**
   * 分页获取用户列表
   */
  async findAllPaginated(query: PaginationQueryDto) {
    return await this.userRepository.findPaginated(query)
  }

  /**
   * 根据ID查找用户
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findActiveById(id)

    if (!user) {
      throw new NotFoundException('User does not exist')
    }

    return user
  }

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findByUsername(username)
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email)
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id) // 复用查找逻辑

    // 检查用户名和邮箱是否已被其他用户使用
    if (updateUserDto.username || updateUserDto.email) {
      const existingUser = await this.userRepository.checkUserExistsExcluding(
        updateUserDto.username !== user.username ? updateUserDto.username : undefined,
        updateUserDto.email !== user.email ? updateUserDto.email : undefined,
        id,
      )

      if (existingUser) {
        if (updateUserDto.username && existingUser.username === updateUserDto.username) {
          throw new ConflictException('Username already exists')
        }
        if (updateUserDto.email && existingUser.email === updateUserDto.email) {
          throw new ConflictException('Email already exists')
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
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id) // 复用查找逻辑

    await this.userRepository.softDelete(user)

    this.logger.info(`User ${user.username}(ID: ${user.id}) has been soft deleted`)
  }

  /**
   * 硬删除用户（真正从数据库中删除）
   * 注意：这个方法应该谨慎使用，建议只在特殊情况下使用
   */
  async forceRemove(id: number): Promise<void> {
    const user = await this.findOne(id)

    await this.userRepository.hardDelete(user)

    this.logger.warn(`User ${user.username}(ID: ${user.id}) has been hard deleted`)
  }

  /**
   * 更新用户密码
   * @param id 用户ID
   * @param passwordHash 新的密码哈希值
   */
  async updatePassword(id: number, passwordHash: string): Promise<User> {
    const user = await this.findOne(id)

    const updatedUser = await this.userRepository.updateUserPassword(user, passwordHash)

    this.logger.info(`User ${user.username}(ID: ${user.id}) password updated`)

    return updatedUser
  }
}

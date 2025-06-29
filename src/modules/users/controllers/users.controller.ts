import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { PaginationQueryDto } from '@shared/dtos'
import { JwtAuthGuard } from '@shared/guards'
import { Response } from '@shared/interceptors'
import { UpdateUserDto } from '../dtos'
import { UsersService } from '../services/users.service'

/**
 * 用户控制器 - 最简化版本
 */
@ApiTags('用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取所有用户列表 - 返回简要信息
   */
  @Get()

  @ApiOperation({ summary: '获取用户列表' })
  async findAll() {
    return await this.usersService.findAll()
  }

  /**
   * 分页获取用户列表
   */
  @Get('paginated')
  @ApiOperation({ summary: '分页获取用户列表' })
  async findPaginated(@Query(ValidationPipe) query: PaginationQueryDto) {
    return await this.usersService.findPaginated(query)
  }

  /**
   * 根据ID获取用户详细信息
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number', required: true })
  @Response({
    groups: ['profile'],
    relations: 'basic', // 显示关联数据的基本信息
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id)
  }

  /**
   * 更新用户信息
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiBody({ type: UpdateUserDto })
  @Response({
    exclude: ['passwordHash', 'isDeleted', 'lastLoginIp'],
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.update(id, updateUserDto)
  }

  /**
   * 删除用户（软删除）
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除用户（软删除）' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.usersService.remove(id)
    return { message: 'User deleted successfully' }
  }
}

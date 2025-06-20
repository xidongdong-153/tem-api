import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'

import { JwtAuthGuard } from 'src/modules/auth'
import { ExcludeFields, SerializeResponse } from 'src/shared/interceptors'
import { PaginationQueryDto, UpdateUserDto } from '../dtos'
import { UsersService } from '../services/users.service'

/**
 * 用户控制器 - 最简化版本
 */
@ApiTags('用户管理')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * 获取所有用户列表 - 返回简要信息
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户列表' })
  @SerializeResponse({
    strategy: 'standard',
    exclude: ['passwordHash', 'isDeleted', 'email', 'phone', 'lastLoginAt', 'lastLoginIp'],
    message: '用户列表获取成功',
  })
  async findAll() {
    return await this.usersService.findAll()
  }

  /**
   * 分页获取用户列表 - 测试分页序列化
   */
  @Get('paginated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '分页获取用户列表' })
  @SerializeResponse({
    strategy: 'pagination',
    exclude: ['passwordHash', 'isDeleted', 'lastLoginIp'],
    message: '分页用户列表获取成功',
  })
  async findAllPaginated(@Query(ValidationPipe) query: PaginationQueryDto) {
    return await this.usersService.findAllPaginated(query)
  }

  /**
   * 根据ID获取用户详细信息
   */
  @Get(':id')
  @ApiOperation({ summary: '根据ID获取用户详情' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @SerializeResponse({
    strategy: 'standard',
    exclude: ['passwordHash', 'isDeleted'],
    message: '用户详情获取成功',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.findOne(id)
  }

  /**
   * 更新用户信息
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新用户信息' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @ApiBody({ type: UpdateUserDto })
  @ExcludeFields('passwordHash', 'isDeleted', 'lastLoginIp')
  @SerializeResponse({
    strategy: 'standard',
    message: '用户信息更新成功',
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除用户（软删除）' })
  @ApiParam({ name: 'id', description: '用户ID', type: 'number' })
  @SerializeResponse({
    strategy: 'raw',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.usersService.remove(id)
    return { message: '用户删除成功' }
  }
}

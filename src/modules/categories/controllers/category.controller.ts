import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@shared/guards'
import { CreateCategoryDto } from '../dtos'
import { CategoryService } from '../services'

@Controller('categories')
@ApiTags('分类')
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: '获取所有分类' })
  async findAll() {
    return this.categoryService.findAll()
  }

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @ApiBody({ type: CreateCategoryDto })
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto)
  }

  @Get(':name')
  @ApiOperation({ summary: '根据名称查找分类' })
  @ApiParam({ name: 'name', type: String, required: true, description: '分类名称' })
  async findCategoryByName(@Param('name') name: string) {
    return this.categoryService.findCategoryByName(name)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除分类' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '分类ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @UseGuards(JwtAuthGuard)
  async softDeleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.softDelete(id)
  }

  @Put(':id/restore')
  @ApiOperation({ summary: '恢复被软删除的分类' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '分类ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @ApiResponse({ status: 409, description: '分类未被删除' })
  @UseGuards(JwtAuthGuard)
  async restoreCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.restore(id)
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '硬删除分类（永久删除）' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '分类ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  @UseGuards(JwtAuthGuard)
  async hardDeleteCategory(@Param('id', ParseIntPipe) id: number) {
    await this.categoryService.hardDelete(id)
  }
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
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
}

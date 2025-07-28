import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@shared/guards'
import { CreateTagDto } from '../dtos'
import { TagService } from '../services'

@Controller('tags')
@ApiTags('标签')
@ApiBearerAuth()
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  async findAllTags() {
    return this.tagService.findAllTags()
  }

  @Get(':name')
  @ApiOperation({ summary: '根据名称查找标签' })
  @ApiParam({ name: 'name', type: String, required: true, description: '标签名称' })
  async findTagByName(@Param('name') name: string) {
    return this.tagService.findTagByName(name)
  }

  @Post()
  @ApiOperation({ summary: '创建标签' })
  @ApiBody({ type: CreateTagDto })
  @UseGuards(JwtAuthGuard)
  async createTag(@Body() createTagDto: CreateTagDto) {
    return this.tagService.createTag(createTagDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除标签' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '标签ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @UseGuards(JwtAuthGuard)
  async softDeleteTag(@Param('id', ParseIntPipe) id: number) {
    await this.tagService.softDelete(id)
  }

  @Put(':id/restore')
  @ApiOperation({ summary: '恢复被软删除的标签' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '标签ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @ApiResponse({ status: 409, description: '标签未被删除' })
  @UseGuards(JwtAuthGuard)
  async restoreTag(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.restore(id)
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '硬删除标签（永久删除）' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '标签ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  @UseGuards(JwtAuthGuard)
  async hardDeleteTag(@Param('id', ParseIntPipe) id: number) {
    await this.tagService.hardDelete(id)
  }
}

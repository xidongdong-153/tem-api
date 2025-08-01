import { UserEntity } from '@modules/users/entities'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@shared/guards'
import { ApiTransform } from '@shared/interceptors'
import { CreateArticleDto, ListArticlesDto, UpdateArticleDto } from '../dtos'
import { ArticleService } from '../services'

@Controller('articles')
@ApiTags('文章')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: '分页查询文章列表' })
  @ApiTransform({
    relationStrategy: 'basic',
  })
  async findPaginated(@Query(ValidationPipe) listDto: ListArticlesDto) {
    return this.articleService.findPaginated(listDto)
  }

  @Post()
  @ApiOperation({ summary: '创建文章' })
  async createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @Request() req: { user: UserEntity },
  ) {
    return this.articleService.createArticle(createArticleDto, req.user)
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取文章详情' })
  @ApiTransform({
    relationStrategy: 'basic',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.findOneWithRelations(id)
  }

  @Get('search/title')
  @ApiOperation({ summary: '根据文章标题查找文章' })
  async findByTitle(@Query('title') title: string) {
    return this.articleService.findByTitle(title)
  }

  @Put(':id')
  @ApiOperation({ summary: '更新文章' })
  async updateArticle(@Param('id', ParseIntPipe) id: number, @Body() updateArticleDto: UpdateArticleDto) {
    return this.articleService.updateArticle(id, updateArticleDto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '软删除文章' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '文章ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async softDeleteArticle(@Param('id', ParseIntPipe) id: number) {
    await this.articleService.softDelete(id)
  }

  @Put(':id/restore')
  @ApiOperation({ summary: '恢复被软删除的文章' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '文章ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  @ApiResponse({ status: 409, description: '文章未被删除' })
  async restoreArticle(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.restore(id)
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '硬删除文章（永久删除）' })
  @ApiParam({ name: 'id', type: Number, required: true, description: '文章ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '文章不存在' })
  async hardDeleteArticle(@Param('id', ParseIntPipe) id: number) {
    await this.articleService.hardDelete(id)
  }
}

import { UserEntity } from '@modules/users/entities'
import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@shared/guards'
import { Response } from '@shared/interceptors'
import { CreateArticleDto, UpdateArticleDto } from '../dtos'
import { ArticleService } from '../services'

@Controller('articles')
@ApiTags('文章')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

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
  @Response({
    relations: 'count',
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
}

import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '@shared/guards'
import { CreateTagDto } from '../dtos'
import { TagService } from '../services'

@Controller('tags')
@ApiTags('标签')
@ApiBearerAuth()

export class TagController {
  constructor(private readonly tagService: TagService) {}

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
}

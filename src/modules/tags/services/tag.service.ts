import { Injectable } from '@nestjs/common'
import { CreateTagDto } from '../dtos'
import { TagRepository } from '../repositories'

@Injectable()
export class TagService {
  constructor(private readonly tagRepository: TagRepository) {}

  async createTag(createTagDto: CreateTagDto) {
    return this.tagRepository.createTag(createTagDto)
  }

  async findTagByName(name: string) {
    return this.tagRepository.findTagByName(name)
  }
}

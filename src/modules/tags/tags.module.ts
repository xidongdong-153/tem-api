import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { TagController } from './controllers'
import { TagEntity } from './entities'
import { TagService } from './services'

@Module({
  imports: [MikroOrmModule.forFeature([TagEntity])],
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagsModule {}

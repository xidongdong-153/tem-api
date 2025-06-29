import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { ArticleController } from './controllers'
import { ArticleEntity } from './entities'
import { ArticleService } from './services'

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ArticleEntity,
    ]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticlesModule {}

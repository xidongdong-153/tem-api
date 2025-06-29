import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'
import { CategoryController } from './controllers'
import { CategoryEntity } from './entities'
import { CategoryService } from './services'

@Module({
  imports: [MikroOrmModule.forFeature([CategoryEntity])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoriesModule {}

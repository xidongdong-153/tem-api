import { MikroOrmModule } from '@mikro-orm/nestjs'
import { LoggerModule } from '@modules/logger'
import { Module } from '@nestjs/common'
import { UsersController } from './controllers'
import { UserEntity } from './entities'
import { UsersService } from './services'

/**
 * 用户模块
 */
@Module({
  imports: [
    LoggerModule,
    MikroOrmModule.forFeature([UserEntity]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}

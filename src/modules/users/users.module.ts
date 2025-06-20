import { MikroOrmModule } from '@mikro-orm/nestjs'
import { Module } from '@nestjs/common'

import { LoggerModule } from '../logger/logger.module'
import { UsersController } from './controllers'
import { User } from './entities/user.entity'
import { UsersService } from './services'

/**
 * 用户模块 - 最简化版本
 */
@Module({
  imports: [
    // 注册用户实体到 MikroORM
    MikroOrmModule.forFeature([User]),
    // 导入日志模块（用于依赖注入）
    LoggerModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
  ],
  exports: [UsersService], // 导出服务，供其他模块使用
})
export class UsersModule {}

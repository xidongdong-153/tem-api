import { MikroOrmModule } from '@mikro-orm/nestjs'
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql'
import { Module } from '@nestjs/common'

import { ConfigService } from '../config/services'
import { createMikroOrmLogger, getMikroOrmDebugConfig, LoggerService } from '../logger/services'

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      inject: [ConfigService, LoggerService],
      useFactory: (configService: ConfigService, loggerService: LoggerService) => {
        const db = configService.database

        // 创建 MikroORM 日志适配器
        const mikroOrmLogger = createMikroOrmLogger(loggerService)
        const debugConfig = getMikroOrmDebugConfig(loggerService)

        return defineConfig({
          dbName: db.dbName,
          driverOptions: {
            connection: {
              host: db.host,
              port: db.port,
              user: db.username,
              password: db.password,
              connectTimeout: db.connectTimeout,
            },
          },
          pool: {
            max: db.maxConnections,
          },
          debug: debugConfig,
          logger: mikroOrmLogger,
          entities: ['./dist/**/*.entity.js'],
          entitiesTs: ['./src/**/*.entity.ts'],
          forceUtcTimezone: true,
          allowGlobalContext: true,
        })
      },
      driver: PostgreSqlDriver,
    }),
  ],
})
export class DatabaseModule {}

import type { SerializeResponseOptions } from '../interfaces'

import { SetMetadata } from '@nestjs/common'
import { SERIALIZATION_METADATA_KEY } from '../constants'

/**
 * 序列化响应装饰器
 * 用于配置方法级别的响应序列化选项
 *
 * @param options 序列化选项
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @SerializeResponse({ strategy: 'standard' })
 *   async findAll(): Promise<User[]> {
 *     return this.userService.findAll()
 *   }
 *
 *   @Get(':id')
 *   @SerializeResponse({
 *     strategy: 'standard',
 *     exclude: ['password', 'refreshToken'],
 *     message: 'User information retrieved successfully'
 *   })
 *   async findOne(@Param('id') id: string): Promise<User> {
 *     return this.userService.findOne(id)
 *   }
 * }
 * ```
 */
export function SerializeResponse(options?: SerializeResponseOptions): MethodDecorator {
  return SetMetadata(SERIALIZATION_METADATA_KEY.RESPONSE_OPTIONS, options ?? {})
}

/**
 * 排除字段装饰器
 * 用于排除响应中的特定字段
 *
 * @param fields 要排除的字段名数组
 * @returns 方法装饰器
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get(':id')
 *   @ExcludeFields('password', 'refreshToken')
 *   async findOne(@Param('id') id: string): Promise<User> {
 *     return this.userService.findOne(id)
 *   }
 * }
 * ```
 */
export function ExcludeFields(...fields: string[]): MethodDecorator {
  return SetMetadata(SERIALIZATION_METADATA_KEY.EXCLUDE_FIELDS, fields)
}

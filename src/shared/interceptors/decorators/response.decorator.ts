import type { ResponseOptions } from '../interfaces/response.interface'
import { SetMetadata } from '@nestjs/common'
import { RESPONSE_OPTIONS_KEY } from '../constants'

/**
 * 统一响应配置装饰器
 * 支持所有响应相关的配置选项
 *
 * @example
 * // 基础用法
 * @Response({ message: '操作成功' })
 *
 * // 排除字段
 * @Response({ exclude: ['password', 'secret'] })
 *
 * // 序列化分组
 * @Response({ groups: ['profile'] })
 *
 * // 原始响应
 * @Response({ raw: true })
 *
 * // 组合配置
 * @Response({
 *   message: '获取用户资料成功',
 *   groups: ['profile'],
 *   exclude: ['internalId']
 * })
 */
export function Response(options: ResponseOptions = {}) {
  return SetMetadata(RESPONSE_OPTIONS_KEY, options)
}

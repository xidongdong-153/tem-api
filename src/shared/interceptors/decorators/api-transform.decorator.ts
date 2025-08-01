import type { ResponseOptions } from '../interfaces/response.interface'
import { SetMetadata } from '@nestjs/common'
import { RESPONSE_OPTIONS_KEY } from '../constants'

/**
 * API 数据转换配置装饰器
 * 支持所有 API 响应转换相关的配置选项
 *
 * @example
 * // 基础用法
 * @ApiTransform({ message: '操作成功' })
 *
 * // 排除字段
 * @ApiTransform({ exclude: ['password', 'secret'] })
 *
 * // 序列化分组
 * @ApiTransform({ groups: ['profile'] })
 *
 * // 原始响应
 * @ApiTransform({ raw: true })
 *
 * // 组合配置
 * @ApiTransform({
 *   message: '获取用户资料成功',
 *   groups: ['profile'],
 *   exclude: ['internalId']
 * })
 */
export function ApiTransform(options: ResponseOptions = {}) {
  return SetMetadata(RESPONSE_OPTIONS_KEY, options)
}

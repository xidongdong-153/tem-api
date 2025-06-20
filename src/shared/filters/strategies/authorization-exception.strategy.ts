import type { ExceptionContext, ExceptionHandleResult, ExceptionStrategy } from '../interfaces'

import { ForbiddenException, HttpStatus, UnauthorizedException } from '@nestjs/common'

/**
 * 授权异常处理策略
 * 专门处理认证和授权相关的异常，提供友好的错误消息
 */
export class AuthorizationExceptionStrategy implements ExceptionStrategy {
  readonly name = 'AuthorizationExceptionStrategy'
  readonly priority = 125 // 高于ValidationExceptionStrategy，低于BusinessExceptionStrategy

  /**
   * 判断是否可以处理该异常
   */
  canHandle(exception: unknown, _context: ExceptionContext): boolean {
    return exception instanceof UnauthorizedException
      || exception instanceof ForbiddenException
  }

  /**
   * 处理授权异常
   */
  handle(exception: unknown, context: ExceptionContext): ExceptionHandleResult {
    if (!this.canHandle(exception, context)) {
      throw new Error('AuthorizationExceptionStrategy cannot handle this exception')
    }

    if (exception instanceof UnauthorizedException) {
      return this.handleUnauthorizedException(exception, context)
    }

    if (exception instanceof ForbiddenException) {
      return this.handleForbiddenException(exception, context)
    }

    // 理论上不会到达这里，但提供兜底处理
    return this.handleGenericAuthException(exception, context)
  }

  /**
   * 处理未认证异常
   */
  private handleUnauthorizedException(
    exception: UnauthorizedException,
    context: ExceptionContext,
  ): ExceptionHandleResult {
    const authIssue = this.identifyAuthenticationIssue(exception, context)
    const friendlyMessage = this.generateUnauthorizedMessage(authIssue)

    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: friendlyMessage,
      code: `AUTH_${authIssue.type}`,
      details: {
        authType: authIssue.type,
        reason: authIssue.reason,
        suggestions: this.generateUnauthorizedSuggestions(authIssue.type),
        requiresLogin: true,
      },
    }
  }

  /**
   * 处理权限不足异常
   */
  private handleForbiddenException(
    exception: ForbiddenException,
    context: ExceptionContext,
  ): ExceptionHandleResult {
    const permissionIssue = this.identifyPermissionIssue(exception, context)
    const friendlyMessage = this.generateForbiddenMessage(permissionIssue)

    return {
      statusCode: HttpStatus.FORBIDDEN,
      message: friendlyMessage,
      code: `AUTH_${permissionIssue.type}`,
      details: {
        permissionType: permissionIssue.type,
        reason: permissionIssue.reason,
        requiredPermissions: permissionIssue.requiredPermissions,
        suggestions: this.generateForbiddenSuggestions(permissionIssue.type),
        requiresPermission: true,
      },
    }
  }

  /**
   * 处理通用授权异常
   */
  private handleGenericAuthException(
    _exception: unknown,
    _context: ExceptionContext,
  ): ExceptionHandleResult {
    return {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Access denied, please check your authentication status',
      code: 'AUTH_GENERIC_ERROR',
      details: {
        suggestions: ['Please log in again', 'Contact system administrator for help'],
      },
    }
  }

  /**
   * 识别认证问题类型
   */
  private identifyAuthenticationIssue(
    exception: UnauthorizedException,
    context: ExceptionContext,
  ): { type: string, reason: string } {
    const message = exception.message
    const authHeader = context.request.headers.authorization

    // 检查是否没有提供认证头
    if (!authHeader) {
      return {
        type: 'TOKEN_MISSING',
        reason: 'Authentication token not included in request',
      }
    }

    // 检查认证头格式
    const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader
    if (!authHeaderStr || !authHeaderStr.startsWith('Bearer ')) {
      return {
        type: 'TOKEN_FORMAT_INVALID',
        reason: 'Authentication token format is incorrect',
      }
    }

    // 根据异常消息判断具体问题
    if (message.includes('expired') || message.includes('过期')) {
      return {
        type: 'TOKEN_EXPIRED',
        reason: 'Authentication token has expired',
      }
    }

    if (message.includes('invalid') || message.includes('无效')) {
      return {
        type: 'TOKEN_INVALID',
        reason: 'Authentication token is invalid or revoked',
      }
    }

    if (message.includes('malformed')) {
      return {
        type: 'TOKEN_MALFORMED',
        reason: 'Authentication token format is malformed',
      }
    }

    // 默认情况
    return {
      type: 'UNAUTHORIZED',
      reason: 'Authentication failed, please log in again',
    }
  }

  /**
   * 识别权限问题类型
   */
  private identifyPermissionIssue(
    exception: ForbiddenException,
    context: ExceptionContext,
  ): { type: string, reason: string, requiredPermissions?: string[] } {
    const message = exception.message
    const path = context.request.url
    const method = context.request.method

    // 根据路径和方法推断需要的权限
    const requiredPermissions = this.inferRequiredPermissions(path, method)

    // 检查是否是角色权限问题
    if (message.includes('role') || message.includes('角色')) {
      return {
        type: 'INSUFFICIENT_ROLE',
        reason: 'Current user role permissions are insufficient',
        requiredPermissions,
      }
    }

    // 检查是否是资源访问权限问题
    if (message.includes('resource') || message.includes('资源')) {
      return {
        type: 'RESOURCE_ACCESS_DENIED',
        reason: 'Access denied to specified resource',
        requiredPermissions,
      }
    }

    // 检查是否是操作权限问题
    if (message.includes('operation') || message.includes('操作')) {
      return {
        type: 'OPERATION_NOT_ALLOWED',
        reason: 'Not authorized to perform this operation',
        requiredPermissions,
      }
    }

    // 默认权限不足
    return {
      type: 'PERMISSION_DENIED',
      reason: 'Insufficient permissions to access this resource',
      requiredPermissions,
    }
  }

  /**
   * 根据路径和方法推断需要的权限
   */
  private inferRequiredPermissions(path: string, method: string): string[] {
    const permissions: string[] = []

    // 根据路径推断资源类型
    if (path.includes('/users')) {
      const basePermission = 'users'

      switch (method.toUpperCase()) {
        case 'GET':
          permissions.push(`${basePermission}.read`)
          break
        case 'POST':
          permissions.push(`${basePermission}.create`)
          break
        case 'PUT':
        case 'PATCH':
          permissions.push(`${basePermission}.update`)
          break
        case 'DELETE':
          permissions.push(`${basePermission}.delete`)
          break
      }
    }

    // 可以根据业务需求添加更多资源类型的权限推断
    if (path.includes('/admin')) {
      permissions.push('admin.access')
    }

    return permissions.length > 0 ? permissions : ['Basic access permission']
  }

  /**
   * 生成未认证的友好消息
   */
  private generateUnauthorizedMessage(authIssue: { type: string, reason: string }): string {
    const messages: Record<string, string> = {
      TOKEN_MISSING: 'Please log in before accessing this resource',
      TOKEN_FORMAT_INVALID: 'Authentication token format is incorrect, please log in again',
      TOKEN_EXPIRED: 'Login session has expired, please log in again',
      TOKEN_INVALID: 'Authentication token is invalid, please log in again',
      TOKEN_MALFORMED: 'Authentication token format is malformed, please log in again',
      UNAUTHORIZED: 'Authentication failed, please log in again',
    }

    return messages[authIssue.type] || 'Access denied, please check your login status'
  }

  /**
   * 生成权限不足的友好消息
   */
  private generateForbiddenMessage(
    permissionIssue: { type: string, reason: string, requiredPermissions?: string[] },
  ): string {
    const messages: Record<string, string> = {
      INSUFFICIENT_ROLE: 'Insufficient account permissions to perform this operation',
      RESOURCE_ACCESS_DENIED: 'Access denied to the specified resource',
      OPERATION_NOT_ALLOWED: 'Current user is not authorized to perform this operation',
      PERMISSION_DENIED: 'Insufficient permissions, please contact administrator for required permissions',
    }

    const baseMessage = messages[permissionIssue.type] || 'Permission verification failed'

    if (permissionIssue.requiredPermissions && permissionIssue.requiredPermissions.length > 0) {
      return `${baseMessage} (Required permissions: ${permissionIssue.requiredPermissions.join(', ')})`
    }

    return baseMessage
  }

  /**
   * 生成未认证异常的修复建议
   */
  private generateUnauthorizedSuggestions(authType: string): string[] {
    const suggestions: Record<string, string[]> = {
      TOKEN_MISSING: [
        'Add Authorization: Bearer <token> in request headers',
        'Check if frontend is correctly sending authentication token',
        'Confirm successful login and access token acquisition',
      ],
      TOKEN_FORMAT_INVALID: [
        'Ensure Bearer token format: Authorization: Bearer <token>',
        'Check if token string is complete and not truncated',
        'Verify if token contains illegal characters',
      ],
      TOKEN_EXPIRED: [
        'Use refresh token to get new access token',
        'Log in again to get new token pair',
        'Check if system time is correct',
      ],
      TOKEN_INVALID: [
        'Log in again to get valid access token',
        'Check if token has been revoked by server',
        'Confirm using token from correct environment',
      ],
      TOKEN_MALFORMED: [
        'Check if token format is correct',
        'Confirm token has not been accidentally modified',
        'Re-acquire standard format JWT token',
      ],
      UNAUTHORIZED: [
        'Log in again to verify identity',
        'Check if account status is normal',
        'Contact system administrator to confirm account permissions',
      ],
    }

    return suggestions[authType] || [
      'Please log in again',
      'Check network connection status',
      'Contact technical support for help',
    ]
  }

  /**
   * 生成权限不足异常的修复建议
   */
  private generateForbiddenSuggestions(permissionType: string): string[] {
    const suggestions: Record<string, string[]> = {
      INSUFFICIENT_ROLE: [
        'Contact system administrator to request higher role permissions',
        'Confirm if current account role configuration is correct',
        'Check if specific business role is required',
      ],
      RESOURCE_ACCESS_DENIED: [
        'Confirm if you have permission to access this resource',
        'Check if resource belongs to current user or organization',
        'Contact resource owner to request access permission',
      ],
      OPERATION_NOT_ALLOWED: [
        'Confirm if current operation is within permission scope',
        'Check if specific function permission is required',
        'Contact administrator to configure corresponding operation permissions',
      ],
      PERMISSION_DENIED: [
        'Contact system administrator to request corresponding permissions',
        'Confirm account status and permission configuration',
        'Check if need to join specific user group',
      ],
    }

    return suggestions[permissionType] || [
      'Contact system administrator to get required permissions',
      'Confirm if account status is normal',
      'Check if permission configuration is correct',
    ]
  }
}

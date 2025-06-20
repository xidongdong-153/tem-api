import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

/**
 * 密码强度验证约束
 */
@ValidatorConstraint({ name: 'passwordStrength', async: false })
export class PasswordStrengthConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    if (!password)
      return false

    // 密码强度要求：
    // 1. 长度至少8位
    // 2. 包含数字
    // 3. 包含字母
    const hasMinLength = password.length >= 8
    const hasNumber = /\d/.test(password)
    const hasLetter = /[a-z]/i.test(password)

    return hasMinLength && hasNumber && hasLetter
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters long and contain numbers and letters'
  }
}

/**
 * 密码强度验证装饰器
 * 使用方式：@IsStrongPassword()
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: PasswordStrengthConstraint,
    })
  }
}

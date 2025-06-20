import antfu from '@antfu/eslint-config'

export default antfu({
  // 基础配置
  typescript: true,
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },

  // 自定义规则覆盖
  rules: {
    // ========== Node.js 环境配置 ==========
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/console': 'off',
    'no-undef': 'off',

    // ========== NestJS 特定规则 ==========
    'ts/no-floating-promises': 'off',
    'ts/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      args: 'after-used',
    }],

    // ========== TypeScript 导入规则 ==========
    'ts/consistent-type-imports': 'off',
    'ts/no-import-type-side-effects': 'error',

    // ========== TypeScript 基础规则（不需要类型信息） ==========
    'ts/interface-name-prefix': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/explicit-module-boundary-types': 'off',
    'ts/no-explicit-any': 'error',
    'ts/no-dynamic-delete': 'off',

    // ========== 代码质量 ==========
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',

    // ========== NestJS 项目适配 ==========
    'unicorn/filename-case': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',

    // ========== API 设计规则 ==========
    'camelcase': ['error', {
      properties: 'never',
      ignoreDestructuring: false,
      ignoreImports: false,
      ignoreGlobals: false,
    }],
  },

  // 忽略的文件模式
  ignores: [
    'dist/**',
    'node_modules/**',
    '*.d.ts',
    'coverage/**',
    '.next/**',
    '.nuxt/**',
    'build/**',
    'tmp/**',
    'src/metadata.ts',
    '**/*.md',
    'src/migrations/**',
  ],
})

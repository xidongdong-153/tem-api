#!/usr/bin/env ts-node
/* eslint-disable no-console */

import * as fs from 'node:fs'
import * as readline from 'node:readline'

// #region 颜色和样式定义 (ANSI escape codes)
const colors = {
  RED: '\u001B[0;31m',
  GREEN: '\u001B[0;32m',
  YELLOW: '\u001B[0;33m',
  BLUE: '\u001B[0;34m',
  PURPLE: '\u001B[0;35m',
  CYAN: '\u001B[0;36m',
  WHITE: '\u001B[0;37m',
  BOLD: '\u001B[1m',
  UNDERLINE: '\u001B[4m',
  NC: '\u001B[0m', // No Color
}

function style(color: keyof typeof colors, text: string) {
  return `${colors[color]}${text}${colors.NC}`
}
// #endregion

// #region 状态标识
const ICONS = {
  SUCCESS: style('GREEN', '✅'),
  ERROR: style('RED', '❌'),
  WARNING: style('YELLOW', '⚠️'),
  INFO: style('BLUE', 'ℹ️'),
  ROCKET: style('CYAN', '🚀'),
  GEAR: style('YELLOW', '⚙️'),
  CHECK: style('GREEN', '🔍'),
  SYNC: style('BLUE', '🔄'),
  TARGET: style('PURPLE', '🎯'),
  BOOK: style('CYAN', '📋'),
  FILE: style('GREEN', '📁'),
}
// #endregion

// #region 环境配置
interface EnvConfig {
  name: string
  file: string
  color: keyof typeof colors
  substitutions: Record<string, string>
}

const ENVIRONMENTS: Record<string, EnvConfig> = {
  development: {
    name: '开发环境',
    file: '.env.development',
    color: 'GREEN',
    substitutions: {
      'NODE_ENV=development': 'NODE_ENV=development',
      'LOG_LEVEL=debug': 'LOG_LEVEL=debug',
      'LOG_ENABLE_CONSOLE=true': 'LOG_ENABLE_CONSOLE=true',
      'LOG_ENABLE_FILE=false': 'LOG_ENABLE_FILE=false',
      'LOG_FORMAT=colorful': 'LOG_FORMAT=colorful',
    },
  },
  production: {
    name: '生产环境',
    file: '.env.production',
    color: 'RED',
    substitutions: {
      'NODE_ENV=development': 'NODE_ENV=production',
      'LOG_LEVEL=debug': 'LOG_LEVEL=info',
      'LOG_ENABLE_CONSOLE=true': 'LOG_ENABLE_CONSOLE=false',
      'LOG_ENABLE_FILE=false': 'LOG_ENABLE_FILE=true',
      'LOG_FORMAT=colorful': 'LOG_FORMAT=json',
    },
  },
  test: {
    name: '测试环境',
    file: '.env.test',
    color: 'YELLOW',
    substitutions: {
      'NODE_ENV=development': 'NODE_ENV=test',
      'LOG_LEVEL=debug': 'LOG_LEVEL=info',
      'LOG_ENABLE_CONSOLE=true': 'LOG_ENABLE_CONSOLE=true',
      'LOG_ENABLE_FILE=false': 'LOG_ENABLE_FILE=true',
      'LOG_FORMAT=colorful': 'LOG_FORMAT=simple',
    },
  },
  docker: {
    name: 'Docker环境',
    file: '.env.docker',
    color: 'CYAN',
    substitutions: {
      'NODE_ENV=development': 'NODE_ENV=production',
      'LOG_LEVEL=debug': 'LOG_LEVEL=info',
      'LOG_ENABLE_CONSOLE=true': 'LOG_ENABLE_CONSOLE=true',
      'LOG_ENABLE_FILE=false': 'LOG_ENABLE_FILE=true',
      'LOG_FORMAT=colorful': 'LOG_FORMAT=json',
      'DB_HOST=localhost': 'DB_HOST=host.docker.internal',
      'SWAGGER_TITLE=NestJS (开发环境)': 'SWAGGER_TITLE=NestJS (Docker环境)',
      'SWAGGER_DESCRIPTION=NestJS 开发环境接口文档':
        'SWAGGER_DESCRIPTION=NestJS Docker环境接口文档',
      'SWAGGER_VERSION=1.0.0-dev': 'SWAGGER_VERSION=1.0.0-docker',
    },
  },
}
// #endregion

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

const EXAMPLE_FILE = '.env.example'

/**
 * 应用环境特定配置
 * @param envKey 环境标识
 * @param envFile 目标文件路径
 */
function applyEnvironmentConfig(envKey: string, envFile: string) {
  const config = ENVIRONMENTS[envKey]
  if (!config)
    return

  let content = fs.readFileSync(envFile, 'utf-8')
  for (const [key, value] of Object.entries(config.substitutions))
    content = content.replace(key, value)

  fs.writeFileSync(envFile, content)
}

/**
 * 打印下一步操作指南
 * @param envKey 环境标识
 */
function printNextSteps(envKey?: keyof typeof ENVIRONMENTS | 'all') {
  console.log('')
  console.log(
    `${ICONS.TARGET} ${style('BOLD', style('BLUE', '下一步操作：'))}`,
  )

  if (envKey === 'all') {
    console.log(`${style('BLUE', '1.')} 根据实际需求编辑对应的配置文件`)
    console.log(
      `${style('BLUE', '2.')} 设置具体的配置值（数据库连接、密钥等）`,
    )
    console.log(`${style('BLUE', '3.')} 根据环境启动应用：`)
    console.log(
      `   - ${style('GREEN', '开发')}: ${style('CYAN', 'pnpm run start:dev')}`,
    )
    console.log(
      `   - ${style('RED', '生产')}: ${style(
        'CYAN',
        'docker-compose -f docker-compose.prod.yml up -d',
      )}`,
    )
    console.log(
      `   - ${style('YELLOW', '测试')}: ${style('CYAN', 'pnpm run test')}`,
    )
    console.log(
      `   - ${style('CYAN', 'Docker')}: ${style(
        'CYAN',
        'docker-compose up -d',
      )}`,
    )
  }
  else if (envKey === 'docker') {
    const envFile = style('PURPLE', ENVIRONMENTS.docker.file)
    console.log(`${style('BLUE', '1.')} 编辑 ${envFile} 文件，设置具体的配置值`)
    console.log(`${style('BLUE', '2.')} 运行 Docker 应用:`)
    console.log(
      `   - ${style('GREEN', '开发环境')}: ${style(
        'CYAN',
        'docker-compose up -d',
      )}`,
    )
    console.log(
      `   - ${style('RED', '生产环境')}: ${style(
        'CYAN',
        'docker-compose -f docker-compose.prod.yml up -d',
      )}`,
    )
    console.log(
      `   - ${style('PURPLE', '一键部署')}: ${style(
        'CYAN',
        'bash scripts/deploy.sh',
      )}`,
    )
    console.log('')
    console.log(
      `${style('CYAN', '🐳')} ${style(
        'BOLD',
        style('BLUE', 'Docker 环境特殊说明：'),
      )}`,
    )
    console.log(
      `- 数据库主机已自动设置为 ${style('YELLOW', 'host.docker.internal')}`,
    )
    console.log(
      `- 如果使用 ${style(
        'YELLOW',
        'Linux',
      )}，可能需要手动设置为宿主机 IP`,
    )
    console.log('- 建议配合 Docker 数据库服务使用')
  }
  else if (envKey) {
    const envFile = style('PURPLE', ENVIRONMENTS[envKey].file)
    console.log(`${style('BLUE', '1.')} 编辑 ${envFile} 文件，设置具体的配置值`)
    console.log(
      `${style('BLUE', '2.')} 运行应用: ${style(
        'CYAN',
        'pnpm run start:dev',
      )} (开发) 或 ${style(
        'CYAN',
        'docker-compose -f docker-compose.prod.yml up -d',
      )} (生产)`,
    )
  }

  console.log('')
  console.log(
    `${ICONS.WARNING} ${style('BOLD', style('YELLOW', '注意事项：'))}`,
  )
  console.log(`- ${style('RED', '生产环境请设置强密码和密钥')}`)
  console.log(
    `- ${style('YELLOW', '不要将包含敏感信息的.env文件提交到版本控制')}`,
  )
  console.log(`- ${style('BLUE', '建议使用密钥管理服务存储敏感配置')}`)
}

/**
 * 同步所有环境的配置文件
 */
async function syncAllEnvironments() {
  const envKeys = Object.keys(ENVIRONMENTS)
  const existingFiles: {
    file: string
    name: string
    color: keyof typeof colors
  }[] = []

  console.log('')
  console.log(`${ICONS.BOOK} ${style('BOLD', '检查现有配置文件...')}`)

  for (const key of envKeys) {
    const env = ENVIRONMENTS[key]
    if (fs.existsSync(env.file)) {
      existingFiles.push({
        file: env.file,
        name: env.name,
        color: env.color,
      })
      console.log(
        `${ICONS.WARNING} ${style(env.color, env.file)} (${
          env.name
        }) ${style('YELLOW', '已存在')}`,
      )
    }
  }

  if (existingFiles.length > 0) {
    console.log('')
    console.log(
      `${ICONS.INFO} ${style(
        'BOLD',
        `发现 ${style(
          'YELLOW',
          String(existingFiles.length),
        )} 个现有配置文件:`,
      )}`,
    )
    existingFiles.forEach(f => console.log(f.file))
    console.log('')
    const answer = await askQuestion(
      style('YELLOW', '是否覆盖所有现有配置文件? (y/N): '),
    )
    if (answer.toLowerCase() !== 'y') {
      console.log(`${ICONS.SUCCESS} ${style('GREEN', '已取消同步操作')}`)
      return
    }
  }

  console.log('')
  console.log(
    `${ICONS.SYNC} ${style('BOLD', style('BLUE', '开始同步所有环境配置文件...'))}`,
  )

  for (const key of envKeys) {
    const env = ENVIRONMENTS[key]
    console.log(
      `${ICONS.GEAR} ${style('CYAN', '正在创建')} ${style(
        env.color,
        env.name,
      )}: ${style('PURPLE', env.file)}`,
    )
    fs.copyFileSync(EXAMPLE_FILE, env.file)
    applyEnvironmentConfig(key, env.file)
    console.log(
      `${ICONS.SUCCESS} ${style(env.color, env.name)} ${style(
        'GREEN',
        '配置完成',
      )}`,
    )
  }

  console.log('')
  console.log(
    `${ICONS.ROCKET} ${style('BOLD', style('GREEN', '所有环境配置文件同步完成！'))}`,
  )
  console.log('')
  console.log(`${ICONS.FILE} ${style('BOLD', '已创建的配置文件：')}`)
  for (const key of envKeys) {
    const env = ENVIRONMENTS[key]
    console.log(`- ${style(env.color, env.file)} (${env.name})`)
  }

  printNextSteps('all')
}

/**
 * 设置单个环境
 * @param envKey 环境标识
 */
async function setupSingleEnvironment(envKey: string) {
  const env = ENVIRONMENTS[envKey]
  if (!env) {
    console.log(`${ICONS.ERROR} ${style('RED', '无效选择')}`)
    return
  }

  const { file: envFile, name: envName, color } = env

  if (fs.existsSync(envFile)) {
    const answer = await askQuestion(
      `${ICONS.WARNING} ${style(
        'YELLOW',
        `${envFile} 文件已存在，是否覆盖? (y/N): `,
      )}`,
    )
    if (answer.toLowerCase() !== 'y') {
      console.log(`${ICONS.SUCCESS} ${style('GREEN', '保持现有配置文件')}`)
      return
    }
  }

  fs.copyFileSync(EXAMPLE_FILE, envFile)
  console.log(
    `${ICONS.SUCCESS} ${style('GREEN', '已创建')} ${style(
      color,
      envName,
    )} ${style('GREEN', '配置文件')}: ${style('PURPLE', envFile)}`,
  )

  applyEnvironmentConfig(envKey, envFile)
  printNextSteps(envKey as keyof typeof ENVIRONMENTS)
}

/**
 * 主函数
 */
async function main() {
  console.log(
    `${ICONS.ROCKET} ${style(
      'BOLD',
      style('CYAN', 'NestJS 环境配置脚本 (TypeScript Version)'),
    )}`,
  )
  console.log(style('CYAN', '=========================================='))

  if (!fs.existsSync(EXAMPLE_FILE)) {
    console.error(
      `${ICONS.ERROR} ${style('RED', `未找到 ${EXAMPLE_FILE} 文件`)}`,
    )
    process.exit(1)
  }

  console.log(`${ICONS.GEAR} ${style('BOLD', '请选择要设置的环境:')}`)
  console.log(
    `${style('BLUE', '1)')} ${style('GREEN', 'development')} (开发环境)`,
  )
  console.log(
    `${style('BLUE', '2)')} ${style('RED', 'production')} (生产环境)`,
  )
  console.log(`${style('BLUE', '3)')} ${style('YELLOW', 'test')} (测试环境)`)
  console.log(
    `${style('BLUE', '4)')} ${style('CYAN', 'docker')} (Docker环境)`,
  )
  console.log(
    `${style('BLUE', '5)')} ${style(
      'PURPLE',
      'all',
    )} (同步到所有环境配置文件)`,
  )

  const choice = await askQuestion(style('YELLOW', '请输入选择 (1-5): '))

  switch (choice.trim()) {
    case '1':
      await setupSingleEnvironment('development')
      break
    case '2':
      await setupSingleEnvironment('production')
      break
    case '3':
      await setupSingleEnvironment('test')
      break
    case '4':
      await setupSingleEnvironment('docker')
      break
    case '5':
      await syncAllEnvironments()
      break
    default:
      console.log(`${ICONS.ERROR} ${style('RED', '无效选择')}`)
      break
  }

  rl.close()
}

main().catch((err) => {
  console.error(`${ICONS.ERROR} ${style('RED', '发生未知错误:')}`, err)
  rl.close()
  process.exit(1)
})

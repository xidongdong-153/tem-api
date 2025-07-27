#!/usr/bin/env ts-node
/* eslint-disable no-console */

import { exec, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as readline from 'node:readline'

// #region 样式和图标定义
const colors = {
  RED: '\u001B[0;31m',
  GREEN: '\u001B[0;32m',
  YELLOW: '\u001B[0;33m',
  BLUE: '\u001B[0;34m',
  PURPLE: '\u001B[0;35m',
  CYAN: '\u001B[0;36m',
  WHITE: '\u001B[0;37m',
  BOLD: '\u001B[1m',
  NC: '\u001B[0m',
}

function style(color: keyof typeof colors, text: string) {
  return `${colors[color]}${text}${colors.NC}`
}

const ICONS = {
  SUCCESS: style('GREEN', '✅'),
  ERROR: style('RED', '❌'),
  WARNING: style('YELLOW', '⚠️'),
  INFO: style('BLUE', 'ℹ️'),
  ROCKET: style('CYAN', '🚀'),
  HAMMER: style('YELLOW', '🔨'),
  STOP: style('RED', '⏹️'),
  BUILD: style('BLUE', '🏗️'),
  WAIT: style('YELLOW', '⏳'),
  CHECK: style('GREEN', '🔍'),
  GLOBE: style('BLUE', '🌐'),
  TEST: style('CYAN', '🧪'),
  PARTY: style('GREEN', '🎉'),
  BULB: style('YELLOW', '💡'),
  DOCKER: style('CYAN', '🐳'),
  BOOK: style('CYAN', '📋'),
  STOP_SIGN: style('RED', '🚫'),
}
// #endregion

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

function executeCommand(command: string, options: { silent?: boolean } = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error && !options.silent) {
        console.error(style('RED', `Command failed: ${command}\n${stderr}`))
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

function streamCommand(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`))
      }
      else {
        resolve(code)
      }
    })
    child.on('error', (err) => {
      reject(err)
    })
  })
}

async function checkPrerequisites() {
  console.log(`${ICONS.CHECK} ${style('CYAN', '检查必要文件...')}`)
  const requiredFiles = ['Dockerfile', 'docker-compose.prod.yml', '.env.docker']
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`${ICONS.ERROR} ${style('RED', `未找到 ${file} 文件`)}`)
      if (file === '.env.docker') {
        console.info(`${ICONS.INFO} ${style('BLUE', '请先运行')}: ${style('CYAN', 'pnpm run env:setup:ts')} ${style('BLUE', '选择 Docker 环境')}`)
      }
      process.exit(1)
    }
  }
  console.log(`${ICONS.SUCCESS} ${style('GREEN', '必要文件检查通过')}\n`)
}

async function selectDeployment(): Promise<{ composeFile: string, envName: string } | 'build_only'> {
  console.log(`${ICONS.HAMMER} ${style('BOLD', '请选择部署方式:')}`)
  console.log(`${style('BLUE', '1)')} ${style('GREEN', '开发环境部署')}`)
  console.log(`${style('BLUE', '2)')} ${style('RED', '生产环境部署')}`)
  console.log(`${style('BLUE', '3)')} ${style('YELLOW', '仅构建镜像')}`)
  const choice = await askQuestion(style('YELLOW', '请输入选择 (1-3): '))

  switch (choice.trim()) {
    case '1':
      return { composeFile: 'docker-compose.yml', envName: style('GREEN', '开发环境') }
    case '2':
      return { composeFile: 'docker-compose.prod.yml', envName: style('RED', '生产环境') }
    case '3':
      return 'build_only'
    default:
      console.error(`${ICONS.ERROR} ${style('RED', '无效选择')}`)
      process.exit(1)
  }
}

async function main() {
  console.log(`${ICONS.ROCKET} ${style('BOLD', style('CYAN', 'NestJS 一键部署脚本 (TypeScript)'))}`)
  console.log(`${style('CYAN', '==================================')}\n`)

  await checkPrerequisites()

  const selection = await selectDeployment()

  if (selection === 'build_only') {
    console.log(`\n${ICONS.HAMMER} ${style('BLUE', '开始构建镜像...')}`)
    try {
      await streamCommand('docker', ['build', '-t', 'tem-api:latest', '.'])
      console.log(`\n${ICONS.SUCCESS} ${style('GREEN', '镜像构建完成')}`)
    }
    catch (error) {
      console.error(`\n${ICONS.ERROR} ${style('RED', '镜像构建失败')}`, error)
    }
    rl.close()
    return
  }

  const { composeFile, envName } = selection

  console.log(`\n${ICONS.BOOK} ${style('BOLD', '部署信息:')}`)
  console.log(`- ${style('BOLD', '环境')}: ${envName}`)
  console.log(`- ${style('BOLD', '配置文件')}: ${style('PURPLE', composeFile)}\n`)

  const confirm = await askQuestion(style('YELLOW', '是否继续部署? (y/N): '))
  if (confirm.toLowerCase() !== 'y') {
    console.log(`\n${ICONS.STOP_SIGN} ${style('YELLOW', '部署已取消')}`)
    rl.close()
    return
  }

  console.log(`\n${ICONS.HAMMER} ${style('BOLD', style('BLUE', '开始部署...'))}`)

  try {
    console.log(`${ICONS.STOP} ${style('YELLOW', '停止现有容器...')}`)
    await executeCommand(`docker-compose -f ${composeFile} down`, { silent: true })

    console.log(`${ICONS.BUILD} ${style('BLUE', '构建并启动容器...')}`)
    await streamCommand('docker-compose', ['-f', composeFile, 'up', '-d', '--build'])

    console.log(`${ICONS.WAIT} ${style('YELLOW', '等待服务启动...')}`)
    await new Promise(resolve => setTimeout(resolve, 10000))

    console.log(`${ICONS.CHECK} ${style('CYAN', '检查服务状态...')}`)
    const psOutput = await executeCommand(`docker-compose -f ${composeFile} ps`)
    if (psOutput.includes('Up')) {
      console.log(`${ICONS.SUCCESS} ${style('BOLD', style('GREEN', '服务启动成功!'))}\n`)
      console.log(`${ICONS.INFO} ${style('BOLD', '服务信息:')}`)
      console.log(psOutput)

      console.log(`\n${ICONS.GLOBE} ${style('BOLD', style('BLUE', '访问地址:'))}`)
      console.log(`- ${style('BOLD', 'API')}: ${style('CYAN', 'http://localhost:3000/api')}`)
      console.log(`- ${style('BOLD', '文档')}: ${style('CYAN', 'http://localhost:3000/api-docs')}`)

      console.log(`\n${ICONS.TEST} ${style('CYAN', '测试API连通性...')}`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      try {
        // 使用带有-f选项的curl，以便在服务器返回错误时，命令本身不会失败
        const curlOutput = await executeCommand('curl -s -f http://localhost:3000/api')
        if (curlOutput) {
          console.log(`${ICONS.SUCCESS} ${style('GREEN', 'API连通性测试通过')}`)
        }
        else {
          throw new Error('API返回为空')
        }
      }
      catch (err) {
        console.warn(`${ICONS.WARNING} ${style('YELLOW', 'API连通性测试失败，请检查日志')}`, err)
        console.info(`${ICONS.INFO} ${style('BLUE', '查看日志')}: ${style('CYAN', `docker-compose -f ${composeFile} logs -f`)}`)
      }
    }
    else {
      throw new Error('服务启动失败')
    }
  }
  catch (err) {
    console.error(`\n${ICONS.ERROR} ${style('RED', '部署失败')}`, err)
    console.info(`${ICONS.INFO} ${style('BLUE', '查看日志')}: ${style('CYAN', `docker-compose -f ${selection.composeFile} logs`)}`)
    process.exit(1)
  }

  console.log(`\n${ICONS.PARTY} ${style('BOLD', style('GREEN', '部署完成!'))}\n`)
  console.log(`${ICONS.BULB} ${style('BOLD', style('YELLOW', '常用命令:'))}`)
  console.log(`- ${style('BOLD', '查看日志')}: ${style('CYAN', `docker-compose -f ${composeFile} logs -f`)}`)
  console.log(`- ${style('BOLD', '重启服务')}: ${style('CYAN', `docker-compose -f ${composeFile} restart`)}`)
  console.log(`- ${style('BOLD', '停止服务')}: ${style('CYAN', `docker-compose -f ${composeFile} down`)}`)
  console.log(`- ${style('BOLD', '进入容器')}: ${style('CYAN', `docker-compose -f ${composeFile} exec tem-api sh`)}`)

  rl.close()
}

main().catch((err) => {
  console.error(`\n${ICONS.ERROR} ${style('RED', '发生未知错误:')}`, err)
  rl.close()
  process.exit(1)
})

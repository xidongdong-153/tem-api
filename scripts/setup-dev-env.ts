#!/usr/bin/env ts-node
/* eslint-disable no-console */

import { exec, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
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
  WAIT: style('YELLOW', '⏳'),
  CHECK: style('GREEN', '🔍'),
  GLOBE: style('BLUE', '🌐'),
  PARTY: style('GREEN', '🎉'),
  BULB: style('YELLOW', '💡'),
  DOCKER: style('CYAN', '🐳'),
  BOOK: style('CYAN', '📋'),
  DATABASE: style('BLUE', '🗄️'),
  WEB: style('GREEN', '🌐'),
}
// #endregion

// #region 配置定义
const COMPOSE_FILE = 'docker-compose.dev-services.yml'
const DOCKER_DIR = 'docker'
const MYSQL_CONF_DIR = path.join(DOCKER_DIR, 'mysql', 'conf.d')
const POSTGRESQL_INIT_DIR = path.join(DOCKER_DIR, 'postgresql', 'init')

interface ServiceSelection {
  mysql: boolean
  phpmyadmin: boolean
  postgresql: boolean
  adminer: boolean
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
        reject(new Error(`Command failed: ${command}\n${stderr}`))
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
      if (code !== 0)
        reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`))
      else
        resolve(code)
    })
    child.on('error', (err) => {
      reject(err)
    })
  })
}

// #region 环境检查
async function checkDockerEnvironment() {
  console.log(`${ICONS.CHECK} ${style('CYAN', '检查环境依赖...')}`)
  try {
    await executeCommand('docker --version')
  }
  catch {
    throw new Error(`Docker 未安装或未启动\n${ICONS.INFO} ${style('BLUE', '请先安装 Docker: https://docs.docker.com/get-docker/')}`)
  }

  try {
    await executeCommand('docker-compose --version')
  }
  catch {
    throw new Error(`Docker Compose 未安装\n${ICONS.INFO} ${style('BLUE', '请先安装 Docker Compose')}`)
  }

  try {
    await executeCommand('docker info')
  }
  catch {
    throw new Error(`Docker 服务未启动\n${ICONS.INFO} ${style('BLUE', '请启动 Docker 服务')}`)
  }

  console.log(`${ICONS.SUCCESS} ${style('GREEN', '环境检查通过')}\n`)
}
// #endregion

// #region 服务选择
async function handleServiceSelection(): Promise<ServiceSelection> {
  console.log(`${ICONS.HAMMER} ${style('BOLD', '请选择要部署的开发服务:')}`)
  console.log(`${ICONS.DATABASE} ${style('BLUE', '1)')} ${style('GREEN', 'MySQL 8.0')} ${style('CYAN', '(数据库)')}`)
  console.log(`${ICONS.WEB} ${style('BLUE', '2)')} ${style('YELLOW', 'MySQL + phpMyAdmin')} ${style('CYAN', '(数据库 + 管理界面)')}`)
  console.log(`${ICONS.DATABASE} ${style('BLUE', '3)')} ${style('GREEN', 'PostgreSQL 15')} ${style('CYAN', '(数据库)')}`)
  console.log(`${ICONS.WEB} ${style('BLUE', '4)')} ${style('YELLOW', 'PostgreSQL + Adminer')} ${style('CYAN', '(数据库 + 管理界面)')}`)
  console.log('')

  const choice = await askQuestion(style('YELLOW', '请输入选择 (1-4): '))

  const selection: ServiceSelection = { mysql: false, phpmyadmin: false, postgresql: false, adminer: false }

  switch (choice.trim()) {
    case '1':
      selection.mysql = true
      break
    case '2':
      selection.mysql = true
      selection.phpmyadmin = true
      break
    case '3':
      selection.postgresql = true
      break
    case '4':
      selection.postgresql = true
      selection.adminer = true
      break
    default:
      throw new Error('无效选择')
  }
  return selection
}

function showSelectedServices(selection: ServiceSelection) {
  console.log(`\n${ICONS.BOOK} ${style('BOLD', '将部署以下服务:')}`)
  if (selection.mysql)
    console.log(`- ${ICONS.DATABASE} ${style('GREEN', 'MySQL 8.0')} ${style('CYAN', '(端口: 3306)')}`)
  if (selection.phpmyadmin)
    console.log(`- ${ICONS.WEB} ${style('YELLOW', 'phpMyAdmin')} ${style('CYAN', '(端口: 8080)')}`)
  if (selection.postgresql)
    console.log(`- ${ICONS.DATABASE} ${style('GREEN', 'PostgreSQL 15')} ${style('CYAN', '(端口: 5432)')}`)
  if (selection.adminer)
    console.log(`- ${ICONS.WEB} ${style('YELLOW', 'Adminer')} ${style('CYAN', '(端口: 8081)')}`)
}

async function confirmDeployment() {
  console.log('')
  const confirm = await askQuestion(style('YELLOW', '是否继续部署? (y/N): '))
  if (confirm.toLowerCase() !== 'y') {
    console.log(`${ICONS.WARNING} ${style('YELLOW', '部署已取消')}`)
    process.exit(0)
  }
}
// #endregion

// #region Docker Compose 配置生成
function generateComposeConfig(selection: ServiceSelection): string {
  console.log(`${ICONS.HAMMER} ${style('BLUE', '生成配置文件...')}`)

  const services: string[] = []
  const volumes: string[] = []

  if (selection.mysql) {
    services.push(`
  mysql:
    image: mysql:8.0
    container_name: tem-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root123456
      MYSQL_DATABASE: tem_dev
      MYSQL_USER: tem_user
      MYSQL_PASSWORD: tem123456
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./${MYSQL_CONF_DIR}:/etc/mysql/conf.d
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - tem-dev-network`)
    volumes.push('  mysql_data:')
  }

  if (selection.postgresql) {
    services.push(`
  postgresql:
    image: postgres:15
    container_name: tem-postgresql
    restart: unless-stopped
    environment:
      POSTGRES_DB: tem_dev
      POSTGRES_USER: tem_user
      POSTGRES_PASSWORD: tem123456
    ports:
      - "5432:5432"
    volumes:
      - postgresql_data:/var/lib/postgresql/data
      - ./${POSTGRESQL_INIT_DIR}:/docker-entrypoint-initdb.d
    networks:
      - tem-dev-network`)
    volumes.push('  postgresql_data:')
  }

  if (selection.phpmyadmin) {
    services.push(`
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: tem-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_USER: root
      PMA_PASSWORD: root123456
    ports:
      - "8080:80"
    depends_on:
      - mysql
    networks:
      - tem-dev-network`)
  }

  if (selection.adminer) {
    services.push(`
  adminer:
    image: adminer:latest
    container_name: tem-adminer
    restart: unless-stopped
    environment:
      ADMINER_DEFAULT_SERVER: postgresql
    ports:
      - "8081:8080"
    depends_on:
      - postgresql
    networks:
      - tem-dev-network`)
  }

  return `services:${services.join('')}

volumes:
${volumes.join('\n')}

networks:
  tem-dev-network:
    driver: bridge
`
}
// #endregion

// #region 配置文件创建
function createConfigFiles(selection: ServiceSelection) {
  console.log(`${ICONS.HAMMER} ${style('BLUE', '创建必要的目录和文件...')}`)
  if (selection.mysql) {
    fs.mkdirSync(MYSQL_CONF_DIR, { recursive: true })
    fs.writeFileSync(path.join(MYSQL_CONF_DIR, 'my.cnf'), getMyCnfContent())
  }
  if (selection.postgresql) {
    fs.mkdirSync(POSTGRESQL_INIT_DIR, { recursive: true })
    fs.writeFileSync(path.join(POSTGRESQL_INIT_DIR, '01-init.sql'), getPostgresInitSqlContent())
  }
}

function getMyCnfContent(): string {
  return `[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
max_connections=200
max_connect_errors=1000
innodb_buffer_pool_size=256M
innodb_log_file_size=64M
innodb_file_per_table=1
log_error=/var/lib/mysql/error.log
slow_query_log=1
slow_query_log_file=/var/lib/mysql/slow.log
long_query_time=2
default_authentication_plugin=mysql_native_password
key_buffer_size=32M
table_open_cache=2000
sort_buffer_size=2M
read_buffer_size=2M
read_rnd_buffer_size=8M
thread_cache_size=8

[client]
default-character-set=utf8mb4

[mysql]
default-character-set=utf8mb4
`
}

function getPostgresInitSqlContent(): string {
  return `-- 创建额外的数据库
CREATE DATABASE tem_test;

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 优化设置
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;
`
}
// #endregion

// #region 服务部署
async function stopExistingServices() {
  console.log(`${ICONS.HAMMER} ${style('BLUE', '停止现有的开发服务...')}`)
  await executeCommand(`docker-compose -f ${COMPOSE_FILE} down`, { silent: true })
}

async function startServices() {
  console.log(`${ICONS.HAMMER} ${style('BLUE', '启动开发服务...')}`)
  await streamCommand('docker-compose', ['-f', COMPOSE_FILE, 'up', '-d'])
}

async function checkServiceHealth(): Promise<boolean> {
  console.log(`${ICONS.CHECK} ${style('CYAN', '检查服务状态...')}`)
  try {
    const output = await executeCommand(`docker-compose -f ${COMPOSE_FILE} ps`)
    return output.includes('Up') || output.includes('running')
  }
  catch {
    return false
  }
}
// #endregion

// #region 结果展示
function showAccessInfo(selection: ServiceSelection) {
  console.log(`\n${ICONS.GLOBE} ${style('BOLD', style('BLUE', '服务访问信息:'))}`)
  if (selection.mysql) {
    console.log(`${ICONS.DATABASE} ${style('BOLD', 'MySQL:')}`)
    console.log(`  - ${style('CYAN', '地址')}: localhost:3306`)
    console.log(`  - ${style('CYAN', 'Root密码')}: root123456`)
    console.log(`  - ${style('CYAN', '数据库')}: tem_dev`)
    console.log(`  - ${style('CYAN', '用户名/密码')}: tem_user/tem123456`)
  }
  if (selection.postgresql) {
    console.log(`${ICONS.DATABASE} ${style('BOLD', 'PostgreSQL:')}`)
    console.log(`  - ${style('CYAN', '地址')}: localhost:5432`)
    console.log(`  - ${style('CYAN', '数据库')}: tem_dev, tem_test`)
    console.log(`  - ${style('CYAN', '用户名/密码')}: tem_user/tem123456`)
  }
  if (selection.phpmyadmin) {
    console.log(`${ICONS.WEB} ${style('BOLD', 'phpMyAdmin:')}`)
    console.log(`  - ${style('CYAN', '访问地址')}: http://localhost:8080`)
    console.log(`  - ${style('CYAN', '用户名/密码')}: root/root123456`)
  }
  if (selection.adminer) {
    console.log(`${ICONS.WEB} ${style('BOLD', 'Adminer:')}`)
    console.log(`  - ${style('CYAN', '访问地址')}: http://localhost:8081`)
    console.log(`  - ${style('CYAN', '系统')}: PostgreSQL`)
    console.log(`  - ${style('CYAN', '服务器')}: postgresql`)
    console.log(`  - ${style('CYAN', '用户名/密码')}: tem_user/tem123456`)
    console.log(`  - ${style('CYAN', '数据库')}: tem_dev`)
  }
}

function showHelpCommands() {
  console.log(`\n${ICONS.BULB} ${style('BOLD', style('YELLOW', '常用命令:'))}`)
  console.log(`- ${style('BOLD', '查看服务状态')}: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} ps`)}`)
  console.log(`- ${style('BOLD', '查看日志')}: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} logs -f`)}`)
  console.log(`- ${style('BOLD', '重启服务')}: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} restart`)}`)
  console.log(`- ${style('BOLD', '停止服务')}: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} down`)}`)
  console.log(`- ${style('BOLD', '清理数据')}: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} down -v`)}`)
}

async function showSuccessInfo(selection: ServiceSelection) {
  console.log(`\n${ICONS.SUCCESS} ${style('GREEN', '部署成功! 开发环境搭建完成!')}`)
  console.log(`\n${ICONS.INFO} ${style('BOLD', '服务状态:')}`)
  await streamCommand('docker-compose', ['-f', COMPOSE_FILE, 'ps'])
  showAccessInfo(selection)
  showHelpCommands()
  console.log(`\n${ICONS.INFO} ${style('BLUE', `配置文件已保存到: ${style('PURPLE', COMPOSE_FILE)}`)}`)
}

function showFailureInfo() {
  console.log(`\n${ICONS.ERROR} ${style('RED', '部分服务启动失败')}`)
  console.log(`${ICONS.INFO} ${style('BLUE', `请运行以下命令查看日志: ${style('CYAN', `docker-compose -f ${COMPOSE_FILE} logs`)}`)}`)
}
// #endregion

// #region 主流程
async function main() {
  console.log(`${ICONS.ROCKET} ${style('BOLD', style('CYAN', 'TEM API 开发环境基础设施部署 (TS Version)'))}`)
  console.log(`${style('CYAN', '==================================================')}`)
  console.log(`${ICONS.INFO} ${style('BLUE', '此脚本将帮助您快速搭建开发环境所需的基础服务')}\n`)

  await checkDockerEnvironment()

  const selection = await handleServiceSelection()
  showSelectedServices(selection)
  await confirmDeployment()

  const composeConfig = generateComposeConfig(selection)
  fs.writeFileSync(COMPOSE_FILE, composeConfig)

  createConfigFiles(selection)

  await stopExistingServices()
  await startServices()

  console.log(`${ICONS.WAIT} ${style('YELLOW', '等待服务启动 (15s)...')}`)
  await new Promise(resolve => setTimeout(resolve, 15000))

  if (await checkServiceHealth())
    await showSuccessInfo(selection)
  else
    showFailureInfo()
}
// #endregion

async function run() {
  try {
    await main()
    console.log(`\n${ICONS.PARTY} ${style('BOLD', style('GREEN', '感谢使用 TEM API 开发环境部署脚本!'))}`)
  }
  catch (error: unknown) {
    if (error instanceof Error)
      console.error(`\n${ICONS.ERROR} ${style('RED', error.message)}`)
    else
      console.error(`\n${ICONS.ERROR} ${style('RED', '发生未知错误')}`)
    process.exit(1)
  }
  finally {
    rl.close()
  }
}

run()

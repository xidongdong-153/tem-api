# TEM API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">基于 NestJS + Fastify 构建的高性能企业级后端API服务</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18-green.svg" alt="Node.js Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue.svg" alt="TypeScript Version" />
  <img src="https://img.shields.io/badge/Package%20Manager-pnpm-orange.svg" alt="Package Manager" />
</p>

## 📖 目录

- [🚀 快速开始](#-快速开始)
- [🛠️ 开发环境](#️-开发环境)
- [📁 项目结构](#-项目结构)
- [🔧 开发工具](#-开发工具)
- [🐳 部署指南](#-部署指南)
- [📚 技术文档](#-技术文档)
- [🤝 贡献指南](#-贡献指南)

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose（用于容器化部署）

### ⚡ 一键启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd tem-api

# 2. 安装依赖
pnpm install

# 3. 设置环境配置
pnpm run env:setup  # 选择开发环境

# 4. 启动开发服务
pnpm run start:dev
```

### 🎯 快速访问

启动成功后，您可以访问：
- **应用地址**: http://localhost:3000
- **API 前缀**: http://localhost:3000/api
- **API 文档**: http://localhost:3000/api-docs
- **配置信息**: http://localhost:3000/api/config

### 🐳 Docker 快速部署

```bash
# 一键 Docker 部署
pnpm run deploy
```

---

## 🛠️ 开发环境

### 🗄️ 开发服务部署

项目提供一键部署开发环境基础设施，无需手动安装数据库：

```bash
# 一键部署开发环境基础设施
pnpm run dev:services
```

**🎯 支持的服务：**
- 🗄️ **MySQL 8.0** - 主数据库服务（端口: 3306）
- 🌐 **phpMyAdmin** - MySQL 管理界面（端口: 8080）

**💡 选择模式：**
- 单独安装数据库
- 数据库 + 管理界面组合

**🔧 服务管理命令：**
```bash
# 启动开发服务
pnpm run dev:services:up

# 停止开发服务  
pnpm run dev:services:down

# 查看服务日志
pnpm run dev:services:logs

# 清理服务数据
pnpm run dev:services:clean
```

### ⚙️ 环境配置

使用内置脚本快速设置多环境配置：

```bash
# 一键设置环境配置
pnpm run env:setup
```

**支持的环境：**
- `.env.development` - 开发环境
- `.env.production` - 生产环境  
- `.env.test` - 测试环境
- `.env.docker` - Docker环境

### 🧪 开发与测试

```bash
# 代码检查与修复
pnpm run lint:check    # 检查代码规范
pnpm run lint:fix      # 自动修复代码规范

# 测试
pnpm run test          # 单元测试
pnpm run test:watch    # 监听模式测试
pnpm run test:e2e      # E2E 测试
pnpm run test:cov      # 测试覆盖率
```

### 🌱 数据填充 (Seeding)

项目集成了 `mikro-orm/seeder` 用于数据库初始化和测试数据填充。

**执行填充：**

```bash
# 填充开发环境数据
pnpm run seed

# 填充生产环境数据（如果需要）
pnpm run seed:prod
```

**创建新的 Seeder：**

```bash
# 创建一个名为 'your-feature' 的 seeder
pnpm run seed:create YourFeatureSeeder
```

**填充顺序：**

为了保证数据完整性，填充脚本会按照预设的依赖顺序执行：

1.  `UserSeeder` - 用户数据
2.  `CategorySeeder` - 分类数据
3.  `TagSeeder` - 标签数据
4.  `ArticleSeeder` - 文章数据（依赖前三者）

所有 Seeder 的执行逻辑由 `src/seeders/database.seeder.ts` 统一管理。

---

## 📁 项目结构

```
tem-api/
├── src/
│   ├── config/              # 配置定义
│   ├── modules/             # 业务模块
│   │   ├── auth/            # 认证模块
│   │   ├── config/          # 配置服务模块
│   │   ├── database/        # 数据库模块
│   │   ├── logger/          # 日志模块
│   │   └── users/           # 用户模块
│   ├── shared/              # 共享模块
│   │   ├── filters/         # 全局异常过滤器
│   │   ├── interceptors/    # 全局拦截器
│   │   └── services/        # 共享服务
│   ├── app.module.ts        # 应用主模块
│   └── main.ts              # 应用入口
├── scripts/                 # 自动化脚本
│   ├── setup-env.sh         # 环境配置脚本
│   ├── setup-dev-env.sh     # 开发环境部署脚本
│   ├── deploy.sh            # 一键部署脚本
│   └── generate-deps-graph.sh  # 依赖分析脚本
├── docker/                  # Docker 配置
├── docs/                    # 项目文档
└── test/                    # 测试文件
```

### 🏗️ 模块组织规范

每个业务模块采用统一的目录结构：

```
modules/example/
├── controllers/             # 控制器
├── services/               # 服务层
├── dtos/                   # 数据传输对象
├── entities/               # 实体类
├── guards/                 # 守卫
├── interceptors/           # 拦截器
├── filters/                # 异常过滤器
├── pipes/                  # 管道
├── decorators/             # 装饰器
├── strategies/             # 策略（如认证策略）
├── tests/                  # 模块测试
├── example.module.ts       # 模块定义
├── index.ts                # 导出文件
└── README.md               # 模块说明
```

---

## 🔧 开发工具

### 🔍 高级依赖分析

项目集成了基于规则引擎驱动的高级依赖分析系统，提供从基础依赖关系到深度架构洞察的全方位分析能力。

**🎯 主要功能：**
- 🔬 **规则引擎分析**: 基于 jq + 模式匹配的多维度架构分析
- 🎨 **多格式可视化**: PNG/SVG 依赖图 + Mermaid 架构图
- 🔄 **循环依赖检测**: 自动检测并生成循环依赖可视化图
- 📊 **架构质量评估**: 模块化、内聚性、耦合度评分

**⚡ 快速使用：**
```bash
# 🎯 完整依赖分析（推荐）
pnpm run deps:graph

# 🔍 仅检查循环依赖
pnpm run deps:analyze
```

**📁 输出文件：**
- `docs/dependency-graphs/project-dependencies.svg` - 整体项目依赖图
- `docs/dependency-graphs/architecture.svg` - 增强架构图
- `docs/dependency-graphs/dependency-report.md` - 高级分析报告

**🛠️ 环境准备：**
```bash
# macOS
brew install graphviz jq

# Ubuntu/Debian  
sudo apt-get install graphviz jq

# CentOS/RHEL
sudo yum install graphviz jq
```

**💡 查看建议：**
- 🖼️ 推荐使用 SVG 格式（支持无损缩放）
- 🔧 VS Code 安装 Mermaid Preview 扩展
- 🌐 复制 `.mmd` 内容到 [Mermaid Live Editor](https://mermaid.live)

---

## 🐳 部署指南

### 🚀 一键部署（推荐）

```bash
# 使用一键部署脚本
pnpm run deploy
```

脚本支持以下部署模式：
- 🟢 **开发环境部署** - 适用于本地测试
- 🔴 **生产环境部署** - 适用于线上环境
- 🟡 **仅构建镜像** - 仅构建 Docker 镜像

### 🔧 手动部署

```bash
# 开发环境
docker-compose up -d --build

# 生产环境
docker-compose -f docker-compose.prod.yml up -d --build

# 查看容器状态
docker-compose ps

# 查看应用日志
docker-compose logs -f tem-api
```

### ✅ 部署验证

```bash
# 健康检查
curl http://localhost:3000/api

# 查看配置信息
curl http://localhost:3000/api/config

# 访问 API 文档
open http://localhost:3000/api-docs
```

### 🛑 停止服务

```bash
# 停止所有容器
pnpm run docker:down

# 或使用 docker-compose
docker-compose down
```

---

## 📚 技术文档

### ✨ 核心特性

- 🚀 **高性能架构**: 基于 Fastify 适配器，比 Express 性能提升 2x
- 📚 **API 文档**: 集成 Swagger/OpenAPI，支持自动生成接口文档
- 🎯 **模块化设计**: 采用 NestJS 模块化架构，代码结构清晰可维护
- 🛡️ **类型安全**: 全面使用 TypeScript，提供完整的类型检查
- 📊 **智能日志**: 基于 Winston 的多级别日志系统，支持敏感信息过滤
- ⚙️ **配置管理**: 基于 NestJS Config 的类型安全配置系统，支持环境变量验证
- 🔍 **代码质量**: 集成 ESLint + Prettier，确保代码规范统一
- 🐳 **容器化部署**: 支持 Docker 一键部署

### 🏗️ 技术栈

- **运行时**: Node.js 18+
- **框架**: NestJS 11.x
- **HTTP 服务器**: Fastify
- **语言**: TypeScript 5.8
- **包管理器**: pnpm
- **配置管理**: NestJS Config + Joi
- **日志**: Winston
- **API 文档**: Swagger/OpenAPI
- **代码规范**: ESLint + @antfu/eslint-config
- **测试**: Jest
- **容器化**: Docker + Docker Compose

### ⚙️ 配置管理

项目采用基于 NestJS Config 的类型安全配置管理系统：

**🎯 特性：**
- 🔍 **类型安全**: 完整的 TypeScript 类型定义
- 🔍 **配置验证**: 使用 Joi 验证环境变量
- 🏗️ **模块化**: 分类管理不同配置组
- 🌍 **环境支持**: 支持多环境配置文件

**🔧 主要环境变量：**

| 变量名            | 说明         | 默认值      |
| ----------------- | ------------ | ----------- |
| `NODE_ENV`        | 运行环境     | development |
| `PORT`            | 服务端口     | 3000        |
| `LOG_LEVEL`       | 日志级别     | info        |
| `LOG_FORMAT`      | 日志格式     | colorful    |
| `SWAGGER_ENABLED` | 是否启用文档 | true        |

**📖 使用示例：**
```typescript
import { Injectable } from '@nestjs/common'
import { ConfigService } from './modules/config/config.service'

@Injectable()
export class YourService {
  constructor(private readonly configService: ConfigService) {}

  someMethod() {
    const appConfig = this.configService.app
    console.log(`服务运行在端口: ${appConfig.port}`)
  }
}
```

### 📚 API 文档

项目集成了 Swagger/OpenAPI 自动文档生成：

- **访问地址**: http://localhost:3000/api-docs
- **支持功能**:
  - 接口在线测试
  - Bearer Token 认证
  - 参数校验说明
  - 响应示例

---

## 🤝 贡献指南

### 📋 提交流程

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add some amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 📝 代码提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
feat: 新增功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

### 🔍 代码规范

项目集成了严格的代码规范检查：

```bash
# 检查代码规范
pnpm run lint:check

# 自动修复代码规范问题
pnpm run lint:fix
```

### 🧪 测试要求

新功能和修复都应该包含相应的测试：

```bash
# 运行所有测试
pnpm run test

# 查看测试覆盖率
pnpm run test:cov
```

---

<p align="center">
  Made with ❤️ by TEM Team
</p>

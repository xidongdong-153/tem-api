import type { EntityManager } from '@mikro-orm/core'
import { Seeder } from '@mikro-orm/seeder'

import { ArticleEntity, ArticleStatus } from '@modules/articles/entities'
import { CategoryEntity } from '@modules/categories/entities'
import { TagEntity } from '@modules/tags/entities'
import { UserEntity } from '@modules/users/entities'
import { SeederLogger } from './utils/seeder-logger.util'

/**
 * 文章数据填充器
 */
export class ArticleSeeder extends Seeder {
  private readonly logger = new SeederLogger('ArticleSeeder')

  async run(em: EntityManager): Promise<void> {
    // 检查是否已有数据
    const existingCount = await em.count(ArticleEntity)
    if (existingCount > 0) {
      this.logger.skip('文章', existingCount)
      return
    }

    // 获取关联数据
    const users = await em.find(UserEntity, {})
    const categories = await em.find(CategoryEntity, {})
    const tags = await em.find(TagEntity, {})

    if (users.length === 0 || categories.length === 0 || tags.length === 0) {
      this.logger.warn('缺少关联数据（用户、分类或标签），跳过文章填充')
      return
    }

    const articles = this.createArticles(users, categories, tags)

    for (const articleData of articles) {
      const article = new ArticleEntity()
      Object.assign(article, articleData)
      em.persist(article)
    }

    await em.flush()
    this.logger.success('文章', articles.length)
  }

  /**
   * 创建文章数据
   */
  private createArticles(users: UserEntity[], categories: CategoryEntity[], tags: TagEntity[]) {
    const getRandomUser = () => users[Math.floor(Math.random() * users.length)]
    const getRandomCategory = () => categories[Math.floor(Math.random() * categories.length)]
    const getRandomTags = (count: number = 3) => {
      const shuffled = [...tags].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, count)
    }

    return [
      {
        tags: getRandomTags(),
        title: 'NestJS 入门指南：构建现代化的 Node.js 应用',
        content: `# NestJS 入门指南

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。它使用现代 JavaScript，完全支持 TypeScript，并结合了 OOP（面向对象编程）、FP（函数式编程）和 FRP（函数响应式编程）的元素。

## 核心特性

1. **模块化架构**：NestJS 使用模块来组织应用程序
2. **依赖注入**：内置强大的依赖注入系统
3. **装饰器**：广泛使用装饰器来定义路由、中间件等
4. **TypeScript 支持**：原生支持 TypeScript

## 快速开始

\`\`\`bash
npm i -g @nestjs/cli
nest new project-name
\`\`\`

这是一个很好的开始！`,
        summary: '本文介绍了 NestJS 框架的基本概念和快速入门方法，适合初学者了解这个现代化的 Node.js 框架。',
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2024-01-15'),
        author: getRandomUser(),
        category: getRandomCategory(),
      },
      {
        title: 'TypeScript 高级类型系统详解',
        content: `# TypeScript 高级类型系统

TypeScript 的类型系统是其最强大的特性之一。本文将深入探讨一些高级类型概念。

## 联合类型和交叉类型

\`\`\`typescript
// 联合类型
type StringOrNumber = string | number

// 交叉类型
type User = { name: string } & { age: number }
\`\`\`

## 条件类型

\`\`\`typescript
type IsString<T> = T extends string ? true : false
\`\`\`

## 映射类型

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}
\`\`\`

这些高级特性让 TypeScript 变得非常强大！`,
        summary: '深入探讨 TypeScript 的高级类型系统，包括联合类型、交叉类型、条件类型和映射类型等概念。',
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2024-01-20'),
        author: getRandomUser(),
        category: getRandomCategory(),
      },
      {
        title: 'Docker 容器化部署最佳实践',
        content: `# Docker 容器化部署最佳实践

容器化已经成为现代应用部署的标准方式。本文分享一些 Docker 使用的最佳实践。

## Dockerfile 优化

1. **使用多阶段构建**
2. **最小化镜像层数**
3. **合理使用缓存**

\`\`\`dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 安全考虑

- 不要以 root 用户运行
- 定期更新基础镜像
- 扫描漏洞

容器化让部署变得简单而可靠！`,
        summary: '分享 Docker 容器化部署的最佳实践，包括 Dockerfile 优化、安全考虑等重要内容。',
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2024-01-25'),
        author: getRandomUser(),
        category: getRandomCategory(),
      },
      {
        title: 'PostgreSQL 性能优化技巧',
        content: `# PostgreSQL 性能优化技巧

数据库性能优化是后端开发中的重要技能。本文分享一些 PostgreSQL 的优化技巧。

## 索引优化

\`\`\`sql
-- 创建复合索引
CREATE INDEX idx_user_email_status ON users(email, status);

-- 部分索引
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
\`\`\`

## 查询优化

1. **使用 EXPLAIN ANALYZE**
2. **避免 SELECT ***
3. **合理使用 JOIN**

## 配置优化

- shared_buffers
- work_mem
- maintenance_work_mem

性能优化是一个持续的过程！`,
        summary: '介绍 PostgreSQL 数据库的性能优化技巧，包括索引优化、查询优化和配置优化等方面。',
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2024-02-01'),
        author: getRandomUser(),
        category: getRandomCategory(),
      },
      {
        title: '前端状态管理方案对比',
        content: `# 前端状态管理方案对比

随着前端应用复杂度的增加，状态管理变得越来越重要。本文对比几种主流的状态管理方案。

## Redux

优点：
- 可预测的状态更新
- 强大的开发工具
- 丰富的生态系统

缺点：
- 样板代码较多
- 学习曲线陡峭

## Zustand

\`\`\`javascript
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
\`\`\`

## Jotai

原子化状态管理，更加灵活。

选择合适的状态管理方案很重要！`,
        summary: '对比分析 Redux、Zustand、Jotai 等前端状态管理方案的优缺点，帮助开发者选择合适的方案。',
        status: ArticleStatus.DRAFT,
        author: getRandomUser(),
        category: getRandomCategory(),
      },
    ]
  }
}

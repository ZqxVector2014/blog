// src/env.ts
// 专属适配 index.ts 主入口
// Cloudflare Workers + D1 + R2 完整环境类型定义

export interface Env {
  // D1 博客文章数据库
  DB: D1Database

  // R2 图片存储桶
  BUCKET: R2Bucket

  // 后台管理员登录密钥
  ADMIN_SECRET: string
}

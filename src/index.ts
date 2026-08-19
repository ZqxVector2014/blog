// src/index.ts
import { Hono } from 'hono'
import type { Env } from './env'
import { registerFrontRoutes } from './routes/front'
import { registerAdminRoutes } from './routes/admin'

const app = new Hono<{ Env: Env }>()

// 托管 public 静态资源（前台、后台html页面）
app.static('/', './public')

// 注册前后台路由
registerFrontRoutes(app)
registerAdminRoutes(app)

export default app

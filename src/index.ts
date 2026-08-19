// src/index.ts
// 全套博客最终接口入口
// 完美适配当前 env.ts 类型、D1、R2、管理员密钥
import { Hono } from 'hono'
import type { Env } from './env'

const app = new Hono<{ Env: Env }>()

// 托管 public 所有静态页面
app.static('/', './public')

// 后台统一鉴权中间件
const adminAuth = async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token || token !== 'blog-admin-ok') {
    return c.json({ success: false, message: '登录失效，请重新登录' }, 401)
  }
  await next()
}

// ====================== 前台公开接口 ======================
// 获取所有已发布文章
app.get('/api/articles', async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT id, title, content, create_time FROM articles WHERE is_draft = 0 ORDER BY create_time DESC`
  ).all()
  return c.json(res.results)
})

// 获取单篇文章详情
app.get('/api/post', async (c) => {
  const id = c.req.query('id')
  if (!id) return c.json(null)
  const data = await c.env.DB.prepare(
    `SELECT id, title, content, create_time FROM articles WHERE id = ? AND is_draft = 0`
  ).bind(id).first()
  return c.json(data)
})

// ====================== 后台管理接口 ======================
// 后台登录
app.post('/api/admin/login', async (c) => {
  const { password } = await c.req.json()
  if (password === c.env.ADMIN_SECRET) {
    return c.json({ success: true, token: 'blog-admin-ok' })
  }
  return c.json({ success: false, message: '密码错误' })
})

// 获取全部文章（草稿+已发布）
app.get('/api/admin/article/list', adminAuth, async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT id, title, is_draft, create_time FROM articles ORDER BY create_time DESC`
  ).all()
  return c.json(res.results)
})

// 编辑文章回显
app.get('/api/admin/article/detail', adminAuth, async (c) => {
  const id = c.req.query('id')
  const data = await c.env.DB.prepare(
    `SELECT id, title, content, is_draft FROM articles WHERE id = ?`
  ).bind(id).first()
  return c.json({ success: !!data, ...data })
})

// 新建/保存文章
app.post('/api/admin/article/save', adminAuth, async (c) => {
  const { id, title, content, is_draft } = await c.req.json()
  const now = new Date().toISOString()

  if (!id) {
    const ret = await c.env.DB.prepare(
      `INSERT INTO articles (title, content, is_draft, create_time) VALUES (?,?,?,?)`
    ).bind(title, content, is_draft ? 1 : 0, now).run()
    return c.json({ success: true, id: ret.lastRowId })
  }

  await c.env.DB.prepare(
    `UPDATE articles SET title=?,content=?,is_draft=? WHERE id=?`
  ).bind(title, content, is_draft ? 1 : 0, id).run()
  return c.json({ success: true, id })
})

// 删除文章
app.post('/api/admin/article/delete', adminAuth, async (c) => {
  const id = c.req.query('id')
  await c.env.DB.prepare(`DELETE FROM articles WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// R2 图片上传
app.post('/api/admin/upload', adminAuth, async (c) => {
  const form = await c.req.formData()
  const file = form.get('file') as File
  if (!file) return c.json({ success: false, message: '无文件' })

  const key = `blog_img/${Date.now()}_${file.name}`
  await c.env.BUCKET.put(key, file)
  const url = `https://pub-${c.env.BUCKET}.r2.dev/${key}`
  return c.json({ success: true, url })
})

export default app

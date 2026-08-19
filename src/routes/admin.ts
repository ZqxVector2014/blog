// src/routes/admin.ts
import type { Hono } from 'hono'
import type { Env } from '../env'
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} from '../db'
import { uploadImageToR2 } from '../r2'

export function registerAdminRoutes(app: Hono<{ Env: Env }>) {
  // 鉴权中间件
  const authMiddleware = async (c, next) => {
    const token = c.req.header('Authorization')
    if (!token || token !== c.env.ADMIN_SECRET) {
      return c.json({ success: false, msg: '无访问权限' }, 401)
    }
    await next()
  }

  // 所有后台接口启用鉴权
  const admin = app.use('/api/admin/*', authMiddleware)

  // 管理员登录校验接口
  admin.post('/api/admin/login', async (c) => {
    const { password } = await c.req.json()
    if (password === c.env.ADMIN_SECRET) {
      return c.json({ success: true, token: password })
    }
    return c.json({ success: false, msg: '密码错误' }, 401)
  })

  // 获取全部文章（草稿+已发布）
  admin.get('/api/admin/articles', async (c) => {
    const list = await getAllArticles(c.env)
    return c.json({ success: true, data: list })
  })

  // 根据ID获取单篇文章
  admin.get('/api/admin/article', async (c) => {
    const idRaw = c.req.query('id')
    const id = Number(idRaw)
    if (!id || isNaN(id)) {
      return c.json({ success: false, msg: '文章ID非法' }, 400)
    }
    const article = await getArticleById(c.env, id)
    if (!article) {
      return c.json({ success: false, msg: '文章不存在' }, 404)
    }
    return c.json({ success: true, data: article })
  })

  // 新建文章
  admin.post('/api/admin/article/create', async (c) => {
    const { title, content, is_draft } = await c.req.json()
    if (!title || !content) {
      return c.json({ success: false, msg: '标题和内容不能为空' }, 400)
    }
    const newId = await createArticle(c.env, title, content, Number(is_draft))
    return c.json({ success: true, id: newId })
  })

  // 修改文章
  admin.put('/api/admin/article/update', async (c) => {
    const { id, title, content, is_draft } = await c.req.json()
    if (!id || !title || !content) {
      return c.json({ success: false, msg: '参数不全' }, 400)
    }
    const ok = await updateArticle(c.env, Number(id), title, content, Number(is_draft))
    if (!ok) {
      return c.json({ success: false, msg: '更新失败' }, 500)
    }
    return c.json({ success: true })
  })

  // 删除文章
  admin.delete('/api/admin/article/delete', async (c) => {
    const { id } = await c.req.json()
    if (!id) {
      return c.json({ success: false, msg: '缺少文章ID' }, 400)
    }
    const ok = await deleteArticle(c.env, Number(id))
    if (!ok) {
      return c.json({ success: false, msg: '删除失败' }, 500)
    }
    return c.json({ success: true })
  })

  // R2图片上传
  admin.post('/api/admin/upload', async (c) => {
    try {
      const formData = await c.req.formData()
      const file = formData.get('file') as File
      if (!file) {
        return c.json({ success: false, msg: '未上传文件' }, 400)
      }
      const url = await uploadImageToR2(c.env, file)
      return c.json({ success: true, url })
    } catch (err) {
      return c.json({ success: false, msg: err.message }, 400)
    }
  })
}

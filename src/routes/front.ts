// src/routes/front.ts
import type { Hono } from 'hono'
import type { Env } from '../env'
import { getPublishedArticles, getArticleById } from '../db'
import { mdToHtml } from '../markdown'

export function registerFrontRoutes(app: Hono<{ Env: Env }>) {
  // 获取所有已发布文章
  app.get('/api/articles', async (c) => {
    const list = await getPublishedArticles(c.env)
    return c.json({ success: true, data: list })
  })

  // 获取单篇文章，并把内容渲染成 HTML
  app.get('/api/post', async (c) => {
    const idRaw = c.req.query('id')
    const id = Number(idRaw)
    if (!id || isNaN(id)) {
      return c.json({ success: false, msg: '文章ID非法' }, 400)
    }
    const article = await getArticleById(c.env, id)
    if (!article) {
      return c.json({ success: false, msg: '文章不存在' }, 404)
    }
    return c.json({
      success: true,
      data: {
        ...article,
        html: mdToHtml(article.content)
      }
    })
  })
}

// src/db.ts
import type { Env } from './env'

export type Article = {
  id: number
  title: string
  content: string
  is_draft: number
  create_time: string
}

/**
 * 获取所有已发布文章（前台）
 */
export async function getPublishedArticles(env: Env): Promise<Article[]> {
  const { results } = await env.DB.prepare(`
    SELECT id, title, content, is_draft, create_time
    FROM articles
    WHERE is_draft = 0
    ORDER BY create_time DESC
  `).all<Article>()
  return results
}

/**
 * 根据ID获取单篇文章
 */
export async function getArticleById(env: Env, id: number): Promise<Article | null> {
  return await env.DB.prepare(`
    SELECT id, title, content, is_draft, create_time
    FROM articles
    WHERE id = ?
  `).bind(id).first<Article>()
}

/**
 * 获取全部文章（草稿 + 已发布，后台管理）
 */
export async function getAllArticles(env: Env): Promise<Article[]> {
  const { results } = await env.DB.prepare(`
    SELECT id, title, content, is_draft, create_time
    FROM articles
    ORDER BY create_time DESC
  `).all<Article>()
  return results
}

/**
 * 新建文章
 */
export async function createArticle(
  env: Env,
  title: string,
  content: string,
  is_draft: number
): Promise<number> {
  const now = new Date().toISOString()
  const res = await env.DB.prepare(`
    INSERT INTO articles (title, content, is_draft, create_time)
    VALUES (?, ?, ?, ?)
  `).bind(title, content, is_draft, now).run()

  return res.lastRowId
}

/**
 * 更新文章
 */
export async function updateArticle(
  env: Env,
  id: number,
  title: string,
  content: string,
  is_draft: number
): Promise<boolean> {
  const res = await env.DB.prepare(`
    UPDATE articles
    SET title = ?, content = ?, is_draft = ?
    WHERE id = ?
  `).bind(title, content, is_draft, id).run()

  return res.changes > 0
}

/**
 * 删除文章
 */
export async function deleteArticle(env: Env, id: number): Promise<boolean> {
  const res = await env.DB.prepare(`
    DELETE FROM articles WHERE id = ?
  `).bind(id).run()

  return res.changes > 0
}

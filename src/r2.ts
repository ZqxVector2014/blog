// src/r2.ts
import type { Env } from './env'

/**
 * 上传图片到 R2 存储桶
 * @param env 环境对象
 * @param file 上传的文件
 * @returns 图片公开访问链接
 */
export async function uploadImageToR2(env: Env, file: File): Promise<string> {
  // 允许的图片类型
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('仅支持 jpeg / png / gif / webp 格式图片')
  }

  // 限制 5MB
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('图片不能大于 5MB')
  }

  // 生成唯一文件名
  const ext = file.name.split('.').pop() || 'png'
  const key = `blog_img/${Date.now()}_${crypto.randomUUID()}.${ext}`

  await env.BUCKET.put(key, file, {
    httpMetadata: {
      contentType: file.type
    }
  })

  return `https://pub-${env.BUCKET}.r2.dev/${key}`
}

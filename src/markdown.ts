// src/markdown.ts
// 轻量 Markdown 转 HTML 渲染模块
// 适配博客文章渲染、无第三方依赖、Workers原生可用

/**
 * 基础 Markdown 转 HTML
 * 支持：标题、加粗、斜体、代码、图片、换行、列表
 * @param md Markdown原文
 * @returns 渲染后HTML
 */
export function mdToHtml(md: string): string {
  if (!md) return ''

  return md
    // 标题
    .replace(/^### (.*?)$/gim, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gim, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gim, '<h1>$1</h1>')
    // 加粗 / 斜体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 图片
    .replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" alt="文章图片" loading="lazy">')
    // 无序列表
    .replace(/^- (.*?)$/gim, '<li>$1</li>')
    // 换行
    .replace(/\n/g, '<br/>')
}

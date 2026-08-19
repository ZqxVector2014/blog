// src/markdown.ts
/**
 * 简易 Markdown 转 HTML
 * 仅基础语法，无第三方依赖，适配 Workers
 * @param md Markdown 原始文本
 * @returns 渲染完成的 HTML
 */
export function mdToHtml(md: string): string {
  if (!md) return ''

  let html = md
    // 一级标题 #
    .replace(/^# (.+)$/gim, '<h1>$1</h1>')
    // 二级标题 ##
    .replace(/^## (.+)$/gim, '<h2>$1</h2>')
    // 三级标题 ###
    .replace(/^### (.+)$/gim, '<h3>$1</h3>')
    // 加粗 **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 斜体 *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 行内代码 `code`
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // 图片 ![alt](url)
    .replace(/!\[.*?\]\((.+?)\)/g, '<img src="$1" loading="lazy">')
    // 无序列表 - item
    .replace(/^- (.+)$/gim, '<li>$1</li>')
    // 换行
    .replace(/\n/g, '<br>')

  return html
}

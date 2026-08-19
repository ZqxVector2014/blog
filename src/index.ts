<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文章编辑器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: system-ui, -apple-system, sans-serif;
        }
        body {
            max-width: 1200px;
            margin: 0 auto;
            padding: 1.5rem 1rem;
            background: #f7f8fa;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .header h2 {
            color: #222;
            font-size: 1.4rem;
        }
        .btn-group {
            display: flex;
            gap: 0.8rem;
        }
        .btn {
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 0.95rem;
            transition: 0.2s;
        }
        .btn-back {
            background: #eee;
            color: #333;
        }
        .btn-draft {
            background: #ff9800;
            color: #fff;
        }
        .btn-publish {
            background: #4caf50;
            color: #fff;
        }
        .card {
            background: #fff;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .input-title {
            width: 100%;
            padding: 0.9rem;
            font-size: 1.3rem;
            border: 1px solid #eee;
            border-radius: 8px;
            margin-bottom: 1.2rem;
            outline: none;
        }
        .input-title:focus {
            border-color: #007bff;
        }
        .tip {
            margin: 1rem 0;
            font-size: 0.9rem;
            color: #666;
        }
        .success-tip {
            color: #4caf50;
        }
        .error-tip {
            color: #dc3545;
        }
        /* 双栏编辑预览布局 */
        .editor-wrap {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            min-height: 500px;
        }
        #editor {
            width: 100%;
            height: 100%;
            padding: 1rem;
            border: 1px solid #eee;
            border-radius: 8px;
            resize: none;
            font-size: 1rem;
            line-height: 1.8;
        }
        #preview {
            width: 100%;
            height: 100%;
            padding: 1rem;
            border: 1px solid #eee;
            border-radius: 8px;
            overflow-y: auto;
            line-height: 1.8;
        }
        /* 原生预览基础MD样式 */
        #preview h1 { font-size: 1.8rem; margin: 1rem 0; border-left:4px solid #007bff; padding-left:10px; }
        #preview h2 { font-size: 1.5rem; margin: 1rem 0; }
        #preview h3 { font-size: 1.2rem; margin: 0.8rem 0; }
        #preview p { margin: 0.8rem 0; }
        #preview code { background:#f4f4f4; padding:2px 6px; border-radius:4px; }
        #preview pre { background:#222; color:#fff; padding:1rem; border-radius:8px; overflow-x:auto; }
        #preview img { max-width:100%; border-radius:8px; margin:1rem 0; }
        #preview ul, #preview ol { padding-left: 1.5rem; margin:0.8rem 0; }
        .upload-tip {
            font-size: 0.85rem;
            color: #888;
            margin: 0.5rem 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2 id="editTitleText">新建文章</h2>
        <div class="btn-group">
            <button class="btn btn-back" onclick="goBack()">返回列表</button>
            <button class="btn btn-draft" onclick="saveDraft()">保存草稿</button>
            <button class="btn btn-publish" onclick="savePublish()">直接发布</button>
        </div>
    </div>

    <div class="card">
        <input type="text" id="articleTitle" class="input-title" placeholder="请输入文章标题">
        <div class="upload-tip">支持粘贴图片自动上传 / 手动插入图片链接</div>
        <div class="editor-wrap">
            <textarea id="editor" placeholder="请输入Markdown内容..."> <div id="preview">预览区域</div>
        </div>
    </div>

    <div class="tip" id="saveTip"></div>

    <script>
        const token = localStorage.getItem('blog_token')
        let articleId = ''

        // 未登录跳转登录页
        if (!token) {
            location.href = '/admin/login.html'
        }

        // 极简MD转HTML（内置、无外部依赖）
        function mdToHtml(md) {
            if(!md) return ''
            return md
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                .replace(/`([^`]+)`/gim, '<code>$1</code>')
                .replace(/!\[.*?\]\((.*?)\)/gim, '<img src="$1" alt="img">')
                .replace(/\n/g, '<br>')
        }

        // 实时预览
        function updatePreview() {
            const content = document.getElementById('editor').value
            document.getElementById('preview').innerHTML = mdToHtml(content)
        }

        // 图片粘贴上传
        document.getElementById('editor').addEventListener('paste', async function(e) {
            const items = e.clipboardData.items
            for(let i = 0; i < items.length; i++) {
                if(items[i].type.indexOf('image') !== -1) {
                    e.preventDefault()
                    const file = items[i].getAsFile()
                    await uploadImgFile(file)
                }
            }
        })

        // 上传图片核心方法
        async function uploadImgFile(file) {
            const formData = new FormData()
            formData.append('file', file)
            try {
                const res = await fetch('/api/admin/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': token
                    },
                    body: formData
                })
                const data = await res.json()
                if (data.success) {
                    // 插入图片MD链接
                    const editor = document.getElementById('editor')
                    const pos = editor.selectionStart
                    const mdImg = `\n![图片](${data.url})\n`
                    editor.value = editor.value.slice(0, pos) + mdImg + editor.value.slice(pos)
                    updatePreview()
                    showTip('图片上传成功')
                } else {
                    showTip('图片上传失败', false)
                }
            } catch (e) {
                showTip('图片上传网络错误', false)
            }
        }

        // 监听输入实时预览
        document.getElementById('editor').addEventListener('input', updatePreview)

        // 统一请求方法
        async function req(url, opts = {}) {
            return fetch(url, {
                ...opts,
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json',
                    ...opts.headers
                }
            })
        }

        // 返回列表
        function goBack() {
            location.href = '/admin/index.html'
        }

        // 获取URL文章ID（编辑模式）
        function getQueryId() {
            const params = new URLSearchParams(location.search)
            return params.get('id') || ''
        }

        // 加载编辑文章数据
        async function loadEditData() {
            articleId = getQueryId()
            if (!articleId) return

            document.getElementById('editTitleText').innerText = '编辑文章'

            try {
                const res = await req(`/api/admin/article/detail?id=${articleId}`)
                const data = await res.json()
                if (data.success) {
                    document.getElementById('articleTitle').value = data.title || ''
                    document.getElementById('editor').value = data.content || ''
                    updatePreview()
                }
            } catch (e) {
                showTip('文章数据加载失败', false)
            }
        }

        // 显示提示信息
        function showTip(text, isSuccess = true) {
            const tipDom = document.getElementById('saveTip')
            tipDom.innerText = text
            tipDom.className = isSuccess ? 'tip success-tip' : 'tip error-tip'
            setTimeout(() => tipDom.innerText = '', 2000)
        }

        // 保存草稿
        async function saveDraft() {
            await saveArticle(true)
        }

        // 发布文章
        async function savePublish() {
            await saveArticle(false)
        }

        // 统一保存逻辑
        async function saveArticle(isDraft) {
            const title = document.getElementById('articleTitle').value.trim()
            const content = document.getElementById('editor').value.trim()

            if (!title) {
                showTip('请输入文章标题', false)
                return
            }
            if (!content) {
                showTip('请输入文章内容', false)
                return
            }

            try {
                const res = await req('/api/admin/article/save', {
                    method: 'POST',
                    body: JSON.stringify({
                        id: articleId,
                        title,
                        content,
                        is_draft: isDraft
                    })
                })

                const data = await res.json()
                if (data.success) {
                    showTip(isDraft ? '草稿保存成功！' : '文章发布成功！')
                    if (!articleId && data.id) {
                        articleId = data.id
                    }
                } else {
                    showTip(data.message || '保存失败', false)
                }
            } catch (e) {
                showTip('网络请求失败', false)
            }
        }

        // 页面初始化
        window.onload = () => {
            updatePreview()
            loadEditData()
        }
    </script>
</body>
</html>

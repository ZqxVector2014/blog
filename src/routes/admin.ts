// 原有 import 保留 r2（不动），新增 github-image
// import { uploadImageToR2 } from "../r2.ts";
import { uploadImageToGithub } from "../github-image.ts";

// ……中间其他路由代码保持不变 ……

// 上传图片接口
admin.post("/upload", async (c) => {
  const token = c.req.header("Authorization");
  if (token !== c.env.ADMIN_SECRET) {
    return c.json({ success: false, msg: "权限不足" }, 401);
  }
  const form = await c.req.formData();
  const file = form.get("file") as File | null;
  if (!file) return c.json({ success: false, msg: "缺少文件" }, 400);

  const arrayBuf = await file.arrayBuffer();
  // GitHub API 需要纯 base64（不要 data:image/xxx;base64, 前缀）
  const uint8 = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
  const base64 = btoa(binary);

  try {
    const url = await uploadImageToGithub(
      c.env,
      file.name,
      base64,
      file.type
    );
    return c.json({ success: true, url });
  } catch (e: any) {
    return c.json({ success: false, msg: e.message }, 500);
  }
});

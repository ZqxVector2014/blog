interface Env {
  GITHUB_USERNAME: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  GITHUB_PAT: string;
}

export async function uploadImageToGithub(env: Env, fileName: string, base64Data: string, contentType: string) {
  const { GITHUB_USERNAME, GITHUB_REPO, GITHUB_BRANCH, GITHUB_PAT } = env;
  const path = `images/${Date.now()}-${fileName}`;

  const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_PAT}`,
      "Content-Type": "application/json",
      "User-Agent": "blog-worker"
    },
    body: JSON.stringify({
      message: `upload image ${fileName}`,
      content: base64Data,
      branch: GITHUB_BRANCH
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`github upload failed: ${err}`);
  }

  // jsDelivr CDN 公开访问链接
  const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_USERNAME}/${GITHUB_REPO}@${GITHUB_BRANCH}/${path}`;
  return cdnUrl;
}

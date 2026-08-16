// /api/save-seans.js
// Vercel Serverless Function — tek yönetici şifresiyle korunur, GitHub API üzerinden
// data/seanslar.json dosyasını günceller. Ayrı bir veritabanı YOK.
//
// Gerekli ortam değişkenleri (Vercel > Project Settings > Environment Variables):
//   ADMIN_PASSWORD   -> senin belirleyeceğin tek yönetici şifresi
//   GITHUB_TOKEN     -> "repo" yetkili bir GitHub Personal Access Token (Fine-grained, sadece bu repo)
//   GITHUB_REPO      -> "kullaniciadi/repo-adi" formatında
//   GITHUB_BRANCH    -> genelde "main"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST isteği kabul edilir.' });
  }

  const { password, seans } = req.body || {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Şifre yanlış.' });
  }
  if (!seans || !seans.baslik || !seans.no || !seans.tarih) {
    return res.status(400).json({ error: 'Film adı, seans numarası ve tarih zorunlu.' });
  }

  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env;
  const filePath = 'data/seanslar.json';
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1) Mevcut dosyayı ve sha'sını oku
    const getRes = await fetch(`${apiUrl}?ref=${GITHUB_BRANCH}`, { headers: ghHeaders });
    if (!getRes.ok) {
      const t = await getRes.text();
      return res.status(502).json({ error: `GitHub'dan dosya okunamadı: ${t}` });
    }
    const fileData = await getRes.json();
    const currentContent = JSON.parse(
      Buffer.from(fileData.content, 'base64').toString('utf-8')
    );

    // 2) Aynı numaralı seans varsa güncelle, yoksa ekle
    const list = currentContent.seanslar || [];
    const idx = list.findIndex((s) => s.no === seans.no);
    if (idx >= 0) list[idx] = seans; else list.push(seans);
    currentContent.seanslar = list;

    // 3) Güncellenmiş içeriği GitHub'a geri yaz (yeni commit)
    const newContentBase64 = Buffer.from(
      JSON.stringify(currentContent, null, 2)
    ).toString('base64');

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({
        message: `Seans №${seans.no}: ${seans.baslik} eklendi/güncellendi`,
        content: newContentBase64,
        sha: fileData.sha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putRes.ok) {
      const t = await putRes.text();
      return res.status(502).json({ error: `GitHub'a yazılamadı: ${t}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

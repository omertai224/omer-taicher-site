import { readFileSync } from 'fs';
import { join } from 'path';

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function handler(req, res) {
  const id = String(req.query.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const cwd = process.cwd();

  let html = readFileSync(join(cwd, 'blog', 'post.html'), 'utf-8');

  if (id) {
    try {
      const data = JSON.parse(readFileSync(join(cwd, 'blog', 'posts.json'), 'utf-8'));
      const post = (data.posts || []).find(p => p.id === id);

      if (post) {
        const title = escapeAttr(stripHtml(post.seo_title || post.title) + ' | עומר טייכר');
        const desc = escapeAttr(stripHtml(post.seo_desc || post.excerpt));
        const baseUrl = `https://${req.headers.host}`;
        const url = `${baseUrl}/blog/post.html?id=${encodeURIComponent(id)}`;
        const image = escapeAttr(post.image || '');

        html = html
          .replace('<title id="page-title">עומר טייכר - הבלוג</title>',
                   `<title id="page-title">${title}</title>`)
          .replace('<meta name="description" id="page-desc" content="">',
                   `<meta name="description" id="page-desc" content="${desc}">`)
          .replace('<meta property="og:title"       content="" id="og-title">',
                   `<meta property="og:title"       content="${title}" id="og-title">`)
          .replace('<meta property="og:description" content="" id="og-desc">',
                   `<meta property="og:description" content="${desc}" id="og-desc">`)
          .replace('<meta property="og:url"         content="" id="og-url">',
                   `<meta property="og:url"         content="${url}" id="og-url">`)
          .replace('<meta property="og:image"       content="" id="og-image">',
                   `<meta property="og:image"       content="${image}" id="og-image">`)
          .replace('<meta name="twitter:title" content="" id="tw-title">',
                   `<meta name="twitter:title" content="${title}" id="tw-title">`)
          .replace('<meta name="twitter:description" content="" id="tw-desc">',
                   `<meta name="twitter:description" content="${desc}" id="tw-desc">`)
          .replace('<meta name="twitter:image" content="" id="tw-image">',
                   `<meta name="twitter:image" content="${image}" id="tw-image">`)
          .replace('<link rel="canonical" id="canonical-url" href="/">',
                   `<link rel="canonical" id="canonical-url" href="${url}">`);
      }
    } catch (e) {
      console.error('OG injection error:', e);
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(html);
}

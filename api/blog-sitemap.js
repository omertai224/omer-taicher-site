import { readFileSync } from 'fs';
import { join } from 'path';

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function handler(req, res) {
  const cwd = process.cwd();
  const data = JSON.parse(
    readFileSync(join(cwd, 'blog', 'posts-index.json'), 'utf-8')
  );

  const posts = (data.posts || []).filter(p => (p.status || 'published') === 'published').sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastMod = posts.length ? posts[0].date : '2025-01-01';

  const baseUrl = `https://${req.headers.host}`;

  const urls = [
    `  <url>
    <loc>${baseUrl}/blog/</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`
  ];

  for (const p of posts) {
    urls.push(`  <url>
    <loc>${baseUrl}/blog/${xmlEscape(p.id)}</loc>
    <lastmod>${p.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
  res.status(200).send(xml);
}

import { readFileSync } from 'fs';
import { join } from 'path';

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toUTCString();
  } catch {
    return dateStr;
  }
}

export default function handler(req, res) {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), 'blog', 'posts.json'), 'utf-8')
  );

  const posts = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const baseUrl = `https://${req.headers.host}`;

  const items = posts.map(p => {
    const title   = xmlEscape(stripHtml(p.title || ''));
    const excerpt = xmlEscape(stripHtml(p.excerpt || '').substring(0, 160));
    const link    = `${baseUrl}/blog/post.html?id=${p.id}`;
    const pubDate = formatDate(p.date);
    const image   = p.image || '';
    const tags    = p.tags || [];

    const cats = tags.length
      ? tags.map(t => `    <category>${xmlEscape(t)}</category>`).join('\n')
      : '    <category>טיפ</category>';

    const enclosure = image
      ? `    <enclosure url="${xmlEscape(image)}" type="image/webp" length="0"/>`
      : '';

    return `  <item>
    <title>${title}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${excerpt}</description>
${cats}
${enclosure}
  </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>עומר טייכר | טיפים</title>
    <link>${baseUrl}/blog/</link>
    <description>טיפים מהשטח מ-25 שנה בתחום המחשבים</description>
    <language>he</language>
    <atom:link href="${baseUrl}/api/blog-feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600');
  res.status(200).send(xml);
}

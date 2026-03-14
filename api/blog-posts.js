import { readFileSync } from 'fs';
import { join } from 'path';

export default function handler(req, res) {
  const data = JSON.parse(
    readFileSync(join(process.cwd(), 'blog', 'posts.json'), 'utf-8')
  );

  const posts = (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const full = req.query.id || '';

  // Single post with full body
  if (full) {
    const post = posts.find(p => p.id === full);
    if (!post) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    const idx = posts.indexOf(post);
    const prev = posts[idx + 1] ? { id: posts[idx + 1].id, title: posts[idx + 1].title } : null;
    const next = posts[idx - 1] ? { id: posts[idx - 1].id, title: posts[idx - 1].title } : null;
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    res.json({ post, prev, next, total: posts.length });
    return;
  }

  // Paginated list without body
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  const start = offset || (page - 1) * limit;
  const slice = posts.slice(start, start + limit).map(({ body, ...rest }) => rest);

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    posts: slice,
    total: posts.length,
    page,
    limit,
    hasMore: start + limit < posts.length
  });
}

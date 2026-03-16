import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadIndex(cwd) {
  const indexPath = join(cwd, 'blog', 'posts-index.json');
  const data = JSON.parse(readFileSync(indexPath, 'utf-8'));
  return (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function loadPost(cwd, id) {
  const postPath = join(cwd, 'blog', 'posts', id + '.json');
  return JSON.parse(readFileSync(postPath, 'utf-8'));
}

export default function handler(req, res) {
  try {
    const cwd = process.cwd();
    const posts = loadIndex(cwd);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const full = req.query.id || '';

    // Single post with full body
    if (full) {
      try {
        const post = loadPost(cwd, full);
        if (!post) {
          res.status(404).json({ error: 'not found' });
          return;
        }
        const idx = posts.findIndex(p => p.id === full);
        const prev = idx >= 0 && posts[idx + 1] ? { id: posts[idx + 1].id, title: posts[idx + 1].title } : null;
        const next = idx >= 0 && posts[idx - 1] ? { id: posts[idx - 1].id, title: posts[idx - 1].title } : null;
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
        res.json({ post, prev, next, total: posts.length });
      } catch (e) {
        res.status(500).json({ error: 'post load failed', detail: e.message, id: full });
      }
      return;
    }

    // Paginated list without body
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const start = offset || (page - 1) * limit;
    const slice = posts.slice(start, start + limit).map(({ body, ...rest }) => rest);

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    const origin = req.headers.origin || '';
    const allowed = ['https://omertai.net', 'https://www.omertai.net'];
    if (allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.json({
      posts: slice,
      total: posts.length,
      page,
      limit,
      hasMore: start + limit < posts.length
    });
  } catch (e) {
    res.status(500).json({ error: 'server error', detail: e.message });
  }
}

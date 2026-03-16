import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function loadIndex(cwd) {
  // Prefer lightweight index (no body), fallback to full posts.json
  const indexPath = join(cwd, 'blog', 'posts-index.json');
  const fullPath = join(cwd, 'blog', 'posts.json');
  const src = existsSync(indexPath) ? indexPath : fullPath;
  const data = JSON.parse(readFileSync(src, 'utf-8'));
  return (data.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function loadPost(cwd, id) {
  // Prefer individual post file, fallback to full posts.json
  const postPath = join(cwd, 'blog', 'posts', id + '.json');
  if (existsSync(postPath)) {
    return JSON.parse(readFileSync(postPath, 'utf-8'));
  }
  const data = JSON.parse(readFileSync(join(cwd, 'blog', 'posts.json'), 'utf-8'));
  return (data.posts || []).find(p => p.id === id) || null;
}

export default function handler(req, res) {
  const cwd = process.cwd();
  const posts = loadIndex(cwd);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const full = req.query.id || '';

  // Single post with full body
  if (full) {
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
}

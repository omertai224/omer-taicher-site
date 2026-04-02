import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const INSTANCE_ID = process.env.GREENAPI_INSTANCE_ID;
const API_TOKEN   = process.env.GREENAPI_TOKEN;
const BASE_URL    = `https://7105.api.greenapi.com/waInstance${INSTANCE_ID}`;
const GITHUB_TOKEN = process.env.SCHEDULED_GITHUB_TOKEN;
const GITHUB_USER = 'omertai224';
const GITHUB_REPO = 'omer-taicher-site';
const GITHUB_BRANCH = 'main';
const CHAT_ID = '972526587420@c.us';

export default async function handler(req, res) {
  // Vercel cron sends GET requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Read scheduled.json from GitHub (source of truth)
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/scheduled.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (!ghRes.ok) {
      return res.status(200).json({ message: 'No scheduled.json found', sent: 0 });
    }

    const ghData = await ghRes.json();
    const scheduledSha = ghData.sha;
    const scheduled = JSON.parse(Buffer.from(ghData.content, 'base64').toString('utf-8'));

    const now = new Date();
    let sentCount = 0;
    let updated = false;

    // Load posts-index for post data
    const cwd = process.cwd();
    const indexPath = join(cwd, 'blog', 'posts-index.json');
    let postsIndex = { posts: [] };
    if (existsSync(indexPath)) {
      postsIndex = JSON.parse(readFileSync(indexPath, 'utf-8'));
    }

    for (const item of scheduled) {
      if (item.sent) continue;

      const sendAt = new Date(item.sendAt);
      if (sendAt > now) continue;

      // Time to send!
      const post = (postsIndex.posts || []).find(p => p.id === item.postId);
      if (!post) {
        item.sent = true;
        item.error = 'post not found';
        updated = true;
        continue;
      }

      const title = (post.title || '').replace(/<\/p>\s*<p>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      const url = `https://omertai.net/blog/${post.id}`;
      // Check if post has interactive tutorial
      let hasTutorial = false;
      try {
        const postPath = join(cwd, 'blog', 'posts', item.postId + '.json');
        if (existsSync(postPath)) {
          const postData = JSON.parse(readFileSync(postPath, 'utf-8'));
          hasTutorial = (postData.body || '').includes('tutorial-cta');
        }
      } catch(e) {}
      const tutorialLine = hasTutorial ? '\n\n🎯 מצורפת הדרכה אינטראקטיבית חינמית!\nצעד אחרי צעד, ממש על המחשב שלכם.\nאין תירוצים של \"אני לא יודע איך\".' : '';
      const caption = 'פוסט חדש עלה ☀️\n\n' + title + tutorialLine + '\n\nלקריאה המלאה 👇\n' + url;

      try {
        let apiUrl, body;
        if (post.image) {
          apiUrl = `${BASE_URL}/sendFileByUrl/${API_TOKEN}`;
          body = { chatId: CHAT_ID, urlFile: post.image, fileName: 'post.webp', caption };
        } else {
          apiUrl = `${BASE_URL}/sendMessage/${API_TOKEN}`;
          body = { chatId: CHAT_ID, message: caption, linkPreview: true };
        }

        const waRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const waData = await waRes.json();

        if (waData.idMessage) {
          item.sent = true;
          item.sentAt = now.toISOString();
          sentCount++;
          updated = true;
        } else {
          item.error = waData;
          updated = true;
        }
      } catch (e) {
        item.error = e.message;
        updated = true;
      }
    }

    // Update scheduled.json on GitHub if anything changed
    if (updated) {
      await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/scheduled.json`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `scheduled-send: ${sentCount} sent`,
          content: Buffer.from(JSON.stringify(scheduled, null, 2)).toString('base64'),
          sha: scheduledSha,
          branch: GITHUB_BRANCH
        })
      });
    }

    return res.status(200).json({ message: 'OK', sent: sentCount, pending: scheduled.filter(s => !s.sent).length });
  } catch (err) {
    console.error('Scheduled send error:', err);
    return res.status(500).json({ error: err.message });
  }
}

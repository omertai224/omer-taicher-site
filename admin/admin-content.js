// ===== TAB: CONTENT =====

// ===== SITE CONTENT (אתר ראשי) =====
async function loadContent() {
  if (GITHUB_REPO !== 'omer-taicher-site') return;
  setStatus('content', 'loading', 'טוען תוכן...');
  try {
    const data = await ghGet('content.json');
    contentSha = data.sha;
    currentData = JSON.parse(decode(data.content));
    populateFields(currentData);
    initImagePickers(currentData);
    setStatus('content', 'ok', 'תוכן נטען — ניתן לערוך ולשמור');
    document.getElementById('save-content-btn').disabled = false;
  } catch(e) {
    setStatus('content', 'error', 'שגיאה: ' + e.message);
  }
}

function flatten(obj, prefix) {
  const result = {};
  for (const key in obj) {
    const fullKey = prefix ? prefix + '.' + key : key;
    const val = obj[key];
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'object') Object.assign(result, flatten(item, fullKey + '.' + i));
        else result[fullKey + '.' + i] = item;
      });
    } else if (typeof val === 'object' && val !== null) {
      Object.assign(result, flatten(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
    if (cur[key] === undefined) cur[key] = isNaN(parts[i+1]) ? {} : [];
    cur = cur[key];
  }
  const last = isNaN(parts[parts.length-1]) ? parts[parts.length-1] : parseInt(parts[parts.length-1]);
  cur[last] = value;
}

function populateFields(data) {
  const flat = flatten(data, '');
  for (const path in flat) {
    const el = document.getElementById(path);
    if (el) el.value = flat[path];
  }
  if (data.hero && data.hero.tags) {
    const tagsEl = document.getElementById('hero.tags');
    if (tagsEl) tagsEl.value = data.hero.tags.join('\n');
  }
}

function toggleBlock(id) {
  document.getElementById('block-' + id).classList.toggle('open');
}

async function saveContent() {
  setStatus('content', 'loading', 'שומר...');
  document.getElementById('save-content-btn').disabled = true;
  try {

    const newData = JSON.parse(JSON.stringify(currentData));
    document.querySelectorAll('[id*="."]').forEach(el => {
      if (el.value !== undefined && el.closest('#tab-content')) {
        if (el.id === 'hero.tags') {
          setByPath(newData, 'hero.tags', el.value.split('\n').map(t => t.trim()).filter(t => t));
        } else {
          setByPath(newData, el.id, el.value);
        }
      }
    });
    const result = await ghPut('content.json', JSON.stringify(newData, null, 2), contentSha, 'עדכון תוכן דף הבית');
    if (result.content) {
      contentSha = result.content.sha;
      currentData = newData;
      setStatus('content', 'ok', '✓ נשמר! Vercel מפרסם...');
    } else {
      setStatus('content', 'error', 'שגיאה: ' + (result.message || 'לא ידוע'));
    }
  } catch(e) {
    setStatus('content', 'error', 'שגיאה: ' + e.message);
  }
  document.getElementById('save-content-btn').disabled = false;
}

// ===== COPY FUNCTIONS =====
function copyToClipboard(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => setStatus('content', 'ok', '✓ ' + label + ' הועתק ללוח'))
      .catch(() => fallbackCopy(text, label));
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try { document.execCommand('copy'); setStatus('content', 'ok', '✓ ' + label + ' הועתק ללוח'); }
  catch(e) { setStatus('content', 'error', 'שגיאה בהעתקה'); }
  document.body.removeChild(ta);
}

function copySection(sectionId, sectionName) {
  const data = {};
  document.querySelectorAll('#block-' + sectionId + ' [id*="."]').forEach(el => {
    if (el.value !== undefined) data[el.id] = el.value;
  });
  copyToClipboard(JSON.stringify(data), sectionName || sectionId);
}

function copyAll() {
  const data = {};
  document.querySelectorAll('#tab-content [id*="."]').forEach(el => {
    if (el.value !== undefined) data[el.id] = el.value;
  });
  copyToClipboard(JSON.stringify(data), 'כל התוכן');
}

// ===== BLOG MANAGEMENT =====
let blogPosts = [];
let blogSha = null;
let blogEditingId = null; // null = פוסט חדש, string = עריכה
let blogScheduled = []; // תזמונים פעילים

async function loadBlogManager() {
  setStatus('content', 'loading', 'טוען פוסטים...');
  const container = document.getElementById('blog-manager');
  if (!container) return;
  try {
    const data = await ghGet('posts.json');
    blogSha = data.sha;
    const parsed = JSON.parse(decode(data.content));
    blogPosts = (parsed.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    // טעינת תזמונים
    try {
      const schedRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/omer-taicher-site/contents/scheduled.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      const sched = await schedRes.json();
      blogScheduled = JSON.parse(decode(sched.content)).filter(s => !s.sent);
    } catch(e) { blogScheduled = []; }

    // שחזור מצב עריכה אחרי רענון
    const savedId = localStorage.getItem('blog_editing_id');
    if (savedId) {
      const post = blogPosts.find(p => p.id === savedId);
      if (post) { blogEditingId = savedId; showBlogForm(post); return; }
      localStorage.removeItem('blog_editing_id');
    }

    renderBlogList();
    setStatus('content', 'ok', blogPosts.length + ' פוסטים נטענו');
  } catch(e) {
    setStatus('content', 'error', 'שגיאה בטעינת פוסטים: ' + e.message);
  }
}


let blogImageFilter = 'all'; // 'all' | 'with' | 'without'

function setBlogImageFilter(val) {
  blogImageFilter = val;
  document.querySelectorAll('.blog-img-filter').forEach(btn => {
    btn.style.background = btn.dataset.val === val ? 'var(--navy)' : 'transparent';
    btn.style.color = btn.dataset.val === val ? '#fff' : 'var(--text-mid)';
  });
  filterBlogList(document.querySelector('#blog-manager input[type=text]')?.value || '');
}

function filterBlogList(query) {
  const q = query.trim().toLowerCase();
  const items = document.getElementById('blog-list-items');
  if (!items) return;
  let filtered = q
    ? blogPosts.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.body || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q)
      )
    : blogPosts;
  if (blogImageFilter === 'with') filtered = filtered.filter(p => p.image);
  if (blogImageFilter === 'without') filtered = filtered.filter(p => !p.image);
  const counter = document.getElementById('blog-search-count');
  if (counter) counter.textContent = filtered.length + ' פוסטים';
  items.innerHTML = filtered.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">לא נמצאו פוסטים</div>`
    : filtered.map(p => {
      const sched = blogScheduled.find(s => s.postId === p.id);
      const schedTag = sched ? `<div style="font-size:0.68rem;background:#e8f5e9;color:#128c7e;border-radius:20px;padding:2px 8px;font-weight:700;margin-top:4px;display:inline-block">⏰ ${sched.sendAt.replace('T',' ').slice(0,16)}</div>` : '';
      return `
      <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
        ${p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="font-size:1.8rem;flex-shrink:0">${p.emoji || '📝'}</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${formatBlogDate(p.date)} · ${p.id}${q && !(p.title||"").toLowerCase().includes(q) && !(p.id||"").toLowerCase().includes(q) && !(p.excerpt||"").toLowerCase().includes(q) ? ' · <span style="color:#f6a67e;font-weight:700">נמצא בתוכן</span>' : ""}</div>
          ${schedTag}
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
          <button onclick="window.open('https://blog.omertai.net/post.html?id=${p.id}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>
          <button onclick="blogCopyById('${p.id}')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">העתק</button>
          <button onclick="blogSendWhatsapp('${p.id}')" style="background:#25d366;color:#fff;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">שלח עכשיו</button>
          <button onclick="blogScheduleWhatsapp('${p.id}')" style="background:#128c7e;color:#fff;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">תזמן</button>
          ${sched ? `<button onclick="blogCancelSchedule('${p.id}')" style="background:#fff3cd;color:#856404;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">בטל תזמון</button>` : ''}
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
        </div>
      </div>`;
    }).join('');
}

function renderBlogList() {
  const container = document.getElementById('blog-manager');
  if (!container) return;

  const listHTML = blogPosts.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">אין פוסטים עדיין</div>`
    : blogPosts.map(p => {
      const sched = blogScheduled.find(s => s.postId === p.id);
      const schedTag = sched ? `<div style="font-size:0.68rem;background:#e8f5e9;color:#128c7e;border-radius:20px;padding:2px 8px;font-weight:700;margin-top:4px;display:inline-block">⏰ ${sched.sendAt.replace('T',' ').slice(0,16)}</div>` : '';
      return `
      <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
        ${p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="font-size:1.8rem;flex-shrink:0">${p.emoji || '📝'}</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${formatBlogDate(p.date)} · ${p.id}</div>
          ${schedTag}
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
          <button onclick="window.open('https://blog.omertai.net/post.html?id=${p.id}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>
          <button onclick="blogCopyById('${p.id}')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">העתק</button>
          <button onclick="blogSendWhatsapp('${p.id}')" style="background:#25d366;color:#fff;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">שלח עכשיו</button>
          <button onclick="blogScheduleWhatsapp('${p.id}')" style="background:#128c7e;color:#fff;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">תזמן</button>
          ${sched ? `<button onclick="blogCancelSchedule('${p.id}')" style="background:#fff3cd;color:#856404;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">בטל תזמון</button>` : ''}
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
        </div>
      </div>`;
    }).join('');

  container.innerHTML = `
    <div style="margin-bottom:14px">
      <input
        type="text"
        placeholder="חיפוש לפי כותרת..."
        oninput="filterBlogList(this.value)"
        style="width:100%;padding:10px 16px;border:1px solid var(--border);border-radius:50px;font-size:0.88rem;font-family:inherit;outline:none;background:var(--cream);direction:rtl;box-sizing:border-box"
      >
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div id="blog-search-count" style="font-size:0.82rem;color:var(--text-light)">${blogPosts.length} פוסטים</div>
      <div style="display:flex;gap:8px">
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="blogCopyPromptNew()">הנחיה לפוסט חדש</button>
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="blogCopyPromptUpgrade()">הנחיה לשדרוג פוסט</button>
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="blogCopyPromptImage()">הנחיה ליצירת תמונה</button>
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="blogCopyAll()">העתק הכל</button>
        <button onclick="blogPasteFromClipboard()" style="background:var(--navy-light);color:var(--navy);border:none;padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">הדבק פוסט</button>
        <button onclick="blogNewPost()" style="background:var(--orange-deep);color:#fff;border:none;padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">+ פוסט חדש</button>
      </div>
    </div>
    <div id="blog-list-items">${listHTML}</div>`;
}

function blogNewPost() {
  blogEditingId = null;
  localStorage.removeItem('blog_editing_id');
  showBlogForm({
    id: '', title: '', excerpt: '', body: '', date: todayISO(), emoji: '📝', image: '', image_alt: '', seo_title: '', seo_desc: ''
  });
}

function postToJSON(post) {
  return JSON.stringify({
    id:        post.id        || '',
    title:     post.title     || '',
    excerpt:   post.excerpt   || '',
    body:      post.body      || '',
    date:      post.date      || '',
    emoji:     post.emoji     || '',
    image:     post.image     || '',
    image_alt: post.image_alt || '',
    seo_title: post.seo_title || '',
    seo_desc:  post.seo_desc  || ''
  });
}

// העת���� מתוך טופס עריכה
async function blogPasteDesignById(postId) {
  try {
    const html = await navigator.clipboard.readText();
    if (!html || !html.trim()) { setStatus('content', 'error', 'הלוח ריק'); return; }
    const idx = blogPosts.findIndex(p => p.id === postId);
    if (idx === -1) { setStatus('content', 'error', 'פוסט לא נמצא'); return; }
    blogPosts[idx].body = html.trim();
    await applyDesignById(postId);
  } catch(e) {
    setStatus('content', 'error', 'לא ניתן לגשת ללוח — אפשר גישה בהגדרות הדפדפן');
  }
}

async function applyDesignById(postId) {
  const idx = blogPosts.findIndex(p => p.id === postId);
  if (idx === -1) return;
  setStatus('content', 'loading', 'שומר...');
  try {
    const fresh = await ghGet('posts.json');
    blogSha = fresh.sha;
    const freshData = JSON.parse(decode(fresh.content));
    let posts = freshData.posts || [];
    const postIdx = posts.findIndex(p => p.id === postId);
    if (postIdx === -1) throw new Error('פוסט לא נמצא');
    posts[postIdx] = blogPosts[idx];
    const result = await ghPut('posts.json', JSON.stringify({ posts }, null, 2), blogSha, 'עדכון עיצוב: ' + postId);
    if (result.content) {
      blogSha = result.content.sha;
      blogPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStatus('content', 'ok', '✓ עיצוב הוחל ונשמר');
      loadBlogManager();
    } else throw new Error(result.message || 'שגיאה');
  } catch(e) {
    setStatus('content', 'error', 'שגיאה: ' + e.message);
  }
}

function blogPasteDesign() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;width:90%;max-width:600px;direction:rtl;">
      <div style="font-size:1rem;font-weight:700;color:var(--navy);margin-bottom:12px">הדבק HTML מעוצב</div>
      <textarea id="paste-design-input" placeholder="הדבק כאן את ה-HTML שקיבלת..." style="width:100%;height:220px;border:1px solid var(--border);border-radius:10px;padding:12px;font-size:0.85rem;font-family:monospace;resize:vertical;box-sizing:border-box;direction:ltr;"></textarea>
      <div style="display:flex;gap:10px;margin-top:14px;justify-content:flex-end;">
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">ביטול</button>
        <button onclick="
          const html = document.getElementById('paste-design-input').value.trim();
          if(html) { document.getElementById('bf-body').innerHTML = html; this.closest('div[style*=fixed]').remove(); }
        " style="background:var(--orange-deep);color:#fff;border:none;padding:9px 20px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">החל עיצוב</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('paste-design-input')?.focus(), 50);
}

function blogCopyPost() {
  const id      = blogEditingId || '';
  const title   = document.getElementById('bf-title')?.innerHTML || '';
  const excerpt = document.getElementById('bf-excerpt')?.innerHTML || '';
  const body    = document.getElementById('bf-body')?.innerHTML || '';
  const date    = document.getElementById('bf-date')?.value || '';
  const existing = blogPosts.find(p => p.id === id) || {};
  const post = { ...existing, id, title, excerpt, body, date };
  navigator.clipboard.writeText(postToJSON(post))
    .then(() => setStatus('content', 'ok', '✓ הפוסט הועתק ללוח'))
    .catch(() => setStatus('content', 'error', 'שגיאה בהעתקה'));
}

// העתק פוסט מהרשימה לפי ID
function blogCopyById(id) {
  const post = blogPosts.find(p => p.id === id);
  if (!post) return;
  navigator.clipboard.writeText(postToJSON(post))
    .then(() => setStatus('content', 'ok', '✓ "' + post.title.slice(0,30) + '" הועתק ללוח'))
    .catch(() => setStatus('content', 'error', 'שגיאה בהעתקה'));
}

// ברירות מחדל להנחיות
const PROMPT_DEFAULTS = {
  new: `אתה עוזר לי לבנות פוסט לבלוג שלי באתר omertai.net.

סגנון הכתיבה של הבלוג:
- שפה חמה, טבעית, אנושית
- שורות קצרות, פסקאות מרווחות
- לשון רבים בלבד (לכם, שלכם, להצטרף) — לא זכר ולא נקבה
- ללא מקפים — רק פסיקות ונקודות
- אחרי כל נקודה — שורה חדשה

מבנה קבוע לכל פוסט:
1. פתיחה עם משל או סצנה מהחיים שהקורא מכיר (לא מתחילים בהסבר טכני)
2. שורה קצרה שמגיבה לסיטואציה — לפעמים מילה אחת בלבד
3. blockquote שמחבר בין הסצנה לנושא הטכני — "ככה בדיוק נראה..."
4. הסבר קצר + רשימת bullet points עם הפתרון המעשי
5. תיבת post-insight עם תובנה אחת מסכמת
6. משפט סיום חד ומודגש

חוקי HTML לגוף הפוסט (שדה body):
- כל קבוצת שורות צמודות = תג <p> אחד
- בין שורות באותה פסקה = <br>
- כותרת ביניים = <h2>
- ציטוט = <blockquote> אחד בלבד — כל שורות הציטוט בתוכו, מופרדות ב-<br>. לעולם לא כמה blockquote נפרדים.
- תיבת תובנה = <div class="post-insight">טקסט</div>
- רשימה = <ul> עם <li> (רק כשצריך פתרון מעשי)
- אין אימוג'ים בשום מקום
- טקסט מודגש חשוב = <strong>

כללי id (URL slug):
- אנגלית ומקפים בלבד — ללא עברית, ללא רווחים, ללא תווים מיוחדים
- קצר ככל האפשר — 2-4 מילים שמתארות את הנושא
- לדוגמה: "wifi-slow", "backup-files", "windows-update"

החזר JSON בלבד, ללא שום טקסט לפני או אחרי:

{
  "id": "english-slug-only",
  "title": "כותרת עם <br> בין שורות אם יש שתיים",
  "excerpt": "שלוש שורות קצרות עם <br> ביניהן — מה שיופיע בכרטיס בבלוג",
  "body": "<p>תוכן הפוסט...</p>",
  "date": "YYYY-MM-DD",
  "emoji": "",
  "image": "",
  "image_alt": "",
  "seo_title": "כותרת הפוסט | עומר טייכר",
  "seo_desc": "תיאור קצר עד 155 תווים"
}

הכותרת והטקסט לפוסט:`,

  upgrade: `אתה מעצב HTML של פוסטים לבלוג שלי באתר omertai.net.

אני מביא לך JSON של פוסט קיים.
המשימה שלך: להחזיר לי את אותו JSON בדיוק, עם אותו טקסט בדיוק — רק לתקן את עיצוב ה-HTML בשדה body, ולוודא שה-id תקין.

חוקי עיצוב HTML לשדה body:
- כל קבוצת שורות צמודות = תג <p> אחד
- בין שורות באותה פסקה = <br>
- כותרת ביניים = <h2>
- ציטוט בולט = <blockquote> אחד בלבד — כל שורות הציטוט בתוכו, מופרדות ב-<br>. לעולם לא כמה blockquote נפרדים.
- תיבת תובנה = <div class="post-insight">טקסט</div>
- רשימה = <ul> עם <li>
- טקסט מודגש = <strong>
- אין אימוג'ים בשום מקום
- אין תגים ריקים, אין <br> בודד בתוך תג ריק

כללי id (URL slug):
- אנגלית ומקפים בלבד — ללא עברית, ללא רווחים, ללא תווים מיוחדים
- אם ה-id קיים וכבר באנגלית — השאר אותו בדיוק
- אם ה-id בעברית או פגום — החלף באנגלית קצרה שמתארת את הנושא (2-4 מילים)
- לדוגמה: "wifi-slow", "backup-files", "windows-update"

כל שאר השדות (title, excerpt, date, image, seo_title, seo_desc) — מעתיק בדיוק כמו שהם, ללא שינוי.

אל תשאל שאלות. אל תוסיף הסברים. החזר JSON בלבד, ללא שום טקסט לפני או אחרי.

הפוסט לשדרוג:`
,
  image: ``
};

function blogCopyPromptImage() {
  openPromptEditor('image');
}

async function openPromptEditor(type) {
  const titles = { new: 'הנחיה לפוסט חדש', upgrade: 'הנחיה לשדרוג פוסט', image: 'הנחיה ליצירת תמונה' };
  const title = titles[type] || type;

  // טוען את הקובץ מ-GitHub
  let currentText = PROMPT_DEFAULTS[type];
  let promptsSha = null;
  let promptsData = { new: PROMPT_DEFAULTS.new, upgrade: PROMPT_DEFAULTS.upgrade };
  try {
    const file = await ghGet('prompts.json');
    promptsSha = file.sha;
    promptsData = JSON.parse(decode(file.content));
    currentText = promptsData[type] || PROMPT_DEFAULTS[type];
  } catch(e) { /* קובץ לא קיים עדיין — ישתמש בברירות מחדל */ }

  const overlay = document.createElement('div');
  overlay.id = 'prompt-editor-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;width:100%;max-width:700px;max-height:90vh;display:flex;flex-direction:column;gap:16px;direction:rtl;box-shadow:0 8px 40px rgba(0,0,0,0.18);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:1.05rem;font-weight:800;color:var(--navy)">${title}</div>
        <button onclick="document.getElementById('prompt-editor-overlay').remove()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-mid);line-height:1;">✕</button>
      </div>
      <textarea id="prompt-editor-text" style="flex:1;min-height:380px;max-height:55vh;border:1px solid var(--border);border-radius:10px;padding:14px;font-size:0.82rem;font-family:monospace;resize:vertical;box-sizing:border-box;direction:rtl;line-height:1.7;outline:none;"></textarea>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <button id="prompt-reset-btn" style="background:none;border:none;cursor:pointer;font-size:0.78rem;color:var(--text-light);font-family:inherit;text-decoration:underline;">איפוס לברירת מחדל</button>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('prompt-editor-overlay').remove()" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit;">ביטול</button>
          <button id="prompt-save-btn" style="background:var(--orange-deep);color:#fff;border:none;padding:9px 24px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit;">שמור והעתק</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const textarea = document.getElementById('prompt-editor-text');
  textarea.value = currentText;
  setTimeout(() => textarea.focus(), 50);

  document.getElementById('prompt-reset-btn').onclick = () => {
    textarea.value = PROMPT_DEFAULTS[type];
  };

  document.getElementById('prompt-save-btn').onclick = async () => {
    const btn = document.getElementById('prompt-save-btn');
    const txt = textarea.value;
    btn.textContent = 'שומר...';
    btn.disabled = true;
    try {
      promptsData[type] = txt;
      const result = await ghPut('prompts.json', JSON.stringify(promptsData, null, 2), promptsSha, 'עדכון הנחיה: ' + type);
      if (result.content) promptsSha = result.content.sha;
      await navigator.clipboard.writeText(txt);
      setStatus('content', 'ok', '✓ ההנחיה נשמרה ב-GitHub והועתקה');
      document.getElementById('prompt-editor-overlay').remove();
    } catch(e) {
      setStatus('content', 'error', 'שגיאה בשמירה: ' + e.message);
      btn.textContent = 'שמור והעתק';
      btn.disabled = false;
    }
  };
}

function blogCopyPromptNew() {
  openPromptEditor('new');
}

function blogCopyPromptUpgrade() {
  openPromptEditor('upgrade');
}

function blogCopyAll() {
  const text = JSON.stringify({ posts: blogPosts }, null, 2);
  navigator.clipboard.writeText(text)
    .then(() => setStatus('content', 'ok', '✓ כל ' + blogPosts.length + ' הפוסטים הועתקו ללוח'))
    .catch(() => setStatus('content', 'error', 'שגיאה בהעתקה'));
}

function blogCancelForm() {
  localStorage.removeItem('blog_editing_id');
  blogEditingId = null;
  loadBlogManager();
}

function blogEditPost(id) {
  const post = blogPosts.find(p => p.id === id);
  if (!post) return;
  blogEditingId = id;
  localStorage.setItem('blog_editing_id', id);
  showBlogForm(post);
}

function stripHtmlAdmin(str) {
  const tmp = document.createElement('div');
  tmp.innerHTML = str || '';
  return tmp.textContent || tmp.innerText || '';
}

function showBlogForm(post) {

  const container = document.getElementById('blog-manager');
  container.innerHTML = `
    <div style="margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:12px">
      <button onclick="blogCancelForm()" style="background:var(--cream);color:var(--navy);border:1px solid var(--border);padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">→ חזרה לרשימה</button>
      <div style="font-size:0.95rem;font-weight:800;color:var(--navy);text-align:center">${blogEditingId ? 'עריכת פוסט' : 'פוסט חדש'}</div>
      <div></div>
    </div>

    <div class="field">
      <div style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap">
        <div>
          <label class="field-label">תאריך *</label>
          <input id="bf-date" type="date" value="${post.date || todayISO()}" style="max-width:200px">
        </div>
        <div style="display:flex;gap:8px;padding-bottom:2px;flex-wrap:wrap">
          ${blogEditingId ? `<button onclick="window.open('https://blog.omertai.net/post.html?id=${blogEditingId}','_blank')" style="background:var(--navy-light);color:var(--navy);border:none;padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>` : ''}
          ${blogEditingId ? `<button onclick="blogDeletePost('${blogEditingId}')" style="background:#fde8e8;color:#c0392b;border:none;padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>` : ''}
          <button onclick="blogSavePost()" id="bf-save-btn" style="background:var(--orange-deep);color:#fff;border:none;padding:10px 28px;border-radius:50px;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:inherit">${blogEditingId ? 'שמור שינויים' : 'פרסם'}</button>
        </div>
      </div>
    </div>

    <div class="field">
      <label class="field-label">כותרת *</label>
      <div id="bf-title" contenteditable="true" oninput="blogAutoSlug()" style="min-height:2.2em;border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:1rem;font-family:inherit;line-height:1.6;background:#fff;outline:none;direction:rtl">${post.title || ''}</div>
    </div>

    <div class="field">
      <label class="field-label">תקציר *</label>
      <div id="bf-excerpt" contenteditable="true" style="min-height:4em;border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:0.95rem;font-family:inherit;line-height:1.7;background:#fff;outline:none;direction:rtl">${post.excerpt || ''}</div>
    </div>

    <div class="field">
      <label class="field-label">גוף הפוסט *</label>
      <div style="display:flex;gap:6px;margin-bottom:6px;align-items:center">
        <button type="button" onmousedown="event.preventDefault();document.execCommand('bold')"
          style="background:var(--cream);border:1px solid var(--border);width:34px;height:34px;border-radius:8px;font-size:0.95rem;font-weight:900;cursor:pointer;font-family:inherit">B</button>
        <button type="button" onmousedown="event.preventDefault();document.execCommand('italic')"
          style="background:var(--cream);border:1px solid var(--border);width:34px;height:34px;border-radius:8px;font-size:0.95rem;font-style:italic;font-weight:700;cursor:pointer;font-family:inherit">I</button>
        <button type="button" onmousedown="event.preventDefault();document.execCommand('underline')"
          style="background:var(--cream);border:1px solid var(--border);width:34px;height:34px;border-radius:8px;font-size:0.95rem;font-weight:700;text-decoration:underline;cursor:pointer;font-family:inherit">U</button>
        <button type="button" onmousedown="event.preventDefault();document.execCommand('insertUnorderedList')"
          title="רשימת בולטים — לחץ שוב לביטול"
          style="background:var(--cream);border:1px solid var(--border);width:34px;height:34px;border-radius:8px;font-size:1rem;cursor:pointer;font-family:inherit">•≡</button>
      </div>
      <div
        id="bf-body"
        contenteditable="true"
        oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'"
        style="min-height:420px;height:auto;padding:18px 20px;border:1px solid var(--border);border-radius:10px;background:#fff;font-size:0.88rem;line-height:1.75;outline:none;cursor:text;font-family:inherit;overflow:hidden"
      >${post.body || ''}</div>
      <style>
        #bf-body, #bf-body * { font-size:0.88rem!important; line-height:1.75!important; font-family:inherit!important; }
        #bf-body p  { margin-bottom: 1.1em; }
        #bf-body h2 { font-size:1rem!important; font-weight:800!important; margin: 1.2em 0 0.4em; color:#1a4a6b; }
        #bf-body br { display:block; content:""; margin-top:0.3em; }
      </style>
    </div>

    <div class="field">
      <label class="field-label">תמונה ראשית</label>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">
        <input id="bf-image" type="text" value="${post.image || ''}" placeholder="URL של תמונה" style="direction:ltr;text-align:left;flex:1;min-width:0">
        <button onclick="triggerImageUpload()" id="bf-upload-btn" style="background:var(--navy);color:#fff;border:none;padding:10px 16px;border-radius:20px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">העלאת תמונה</button>
        <button onclick="openBlogGalleryPicker()" style="background:var(--cream);color:var(--navy);border:1.5px solid var(--navy);padding:10px 16px;border-radius:20px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">בחירה מגלריה</button>
        <input type="file" id="bf-image-file" accept="image/*,video/*" style="display:none" onchange="uploadToCloudinary(this)">
      </div>
      <div id="bf-image-preview" style="margin-top:8px;${post.image ? '' : 'display:none'}">
        <img src="${post.image || ''}" style="max-width:100%;max-height:140px;border-radius:10px;border:1px solid var(--border);object-fit:cover">
        <button onclick="clearPostImage()" style="display:block;margin-top:6px;background:#fde8e8;color:#c0392b;border:none;padding:5px 14px;border-radius:20px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">✕ הסר תמונה</button>
      </div>
      <div id="bf-upload-status" style="font-size:0.75rem;color:var(--text-light);margin-top:6px"></div>
    </div>

    <div class="field" style="margin-top:28px;background:#f0f6fb;border:1.5px solid #c3d9ec;border-radius:14px;padding:18px 20px;">
      <div style="font-size:0.82rem;font-weight:800;color:var(--navy);margin-bottom:14px;display:flex;align-items:center;gap:7px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        SEO וסושיאל
      </div>
      <div class="field" style="margin-bottom:12px">
        <label class="field-label">כותרת SEO (לשונית + שיתוף)</label>
        <input id="bf-seo-title" type="text" value="${post.seo_title || ''}" oninput="this.dataset.edited='1';this.dataset.cleared=this.value===''?'1':'';document.getElementById('bf-seo-title-count').textContent=this.value.length+' תווים'" placeholder="כותרת | עומר טייכר" style="direction:rtl">
        <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px" id="bf-seo-title-count">${(post.seo_title||'').length} תווים</div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label class="field-label">תיאור SEO (גוגל + שיתוף)</label>
        <textarea id="bf-seo-desc" rows="2" oninput="this.dataset.edited='1';this.dataset.cleared=this.value===''?'1':'';document.getElementById('bf-seo-desc-count').textContent=this.value.length+' / 155 תווים'" placeholder="תיאור קצר עד 155 תווים" style="direction:rtl;resize:vertical">${post.seo_desc || ''}</textarea>
        <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px" id="bf-seo-desc-count">${(post.seo_desc||'').length} / 155 תווים</div>
      </div>
      <div class="field">
        <label class="field-label">תיאור תמונה (image_alt)</label>
        <input id="bf-image-alt" type="text" value="${post.image_alt || ''}" placeholder="תיאור התמונה לנגישות ו-SEO" style="direction:rtl">
      </div>
      <div class="field" style="margin-top:12px">
        <label class="field-label">URL Slug (אנגלית בלבד)</label>
        <input id="bf-id" type="text" value="${titleToSlug(post.id || '')}" placeholder="post-url-slug" style="direction:ltr;text-align:left" oninput="this.value=this.value.replace(/[^a-zA-Z0-9\\-]/g,'').toLowerCase();this.dataset.cleared=this.value===''?'1':''">
        <div style="font-size:0.72rem;color:var(--text-light);margin-top:4px">משמש גם כשם קובץ התמונה</div>
      </div>
    </div>

    <div style="margin-top:24px;display:flex;gap:12px;align-items:center">
      <button onclick="blogSavePost()" id="bf-save-btn-bottom" style="background:var(--orange-deep);color:#fff;border:none;padding:12px 32px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit">${blogEditingId ? 'שמור שינויים' : 'פרסם'}</button>
      <button onclick="blogCancelForm()" style="background:transparent;color:var(--text-mid);border:1px solid var(--border);padding:11px 24px;border-radius:50px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>
    <div id="bf-alert" style="margin-top:14px"></div>`;
}

// ===== CLOUDINARY =====
const CLOUDINARY_CLOUD = 'drxyfq0cq';
const CLOUDINARY_PRESET = 'omer_site';

function triggerImageUpload() {
  document.getElementById('bf-image-file').click();
}

function getPostSlug() {
  const idField = document.getElementById('bf-id');
  if (idField && idField.value.trim()) return idField.value.trim();
  if (blogEditingId && /^[a-zA-Z0-9\-]+$/.test(blogEditingId)) return blogEditingId;
  const title = document.getElementById('bf-title')?.innerText || '';
  return titleToSlug(title);
}

async function uploadToCloudinary(input) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById('bf-upload-status');
  const btn = document.getElementById('bf-upload-btn');
  status.textContent = 'מעלה...';
  btn.disabled = true;
  btn.textContent = 'מעלה...';
  try {
    const slug = getPostSlug();
    const ext = file.name.split('.').pop().toLowerCase();
    const key = (slug || Date.now()) + '_hero.' + ext;
    const res = await fetch(`${WORKER_URL}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    const data = await res.json();
    if (data.url) {
      document.getElementById('bf-image').value = data.url;
      const preview = document.getElementById('bf-image-preview');
      preview.style.display = 'block';
      preview.querySelector('img').src = data.url;
      status.style.color = 'var(--green)';
      status.textContent = '✓ הועלה בהצלחה';
      // הוספה אוטומטית לגלריה קטגוריית בלוג
      galleryItems.unshift({ url: data.url, type: 'image', name: key, date: new Date().toISOString(), category: 'בלוג' });
      await autoSaveGallery();
    } else {
      throw new Error(data.error || 'שגיאה לא ידועה');
    }
  } catch(e) {
    status.style.color = 'var(--red)';
    status.textContent = 'שגיאה: ' + e.message;
  }
  btn.disabled = false;
  btn.textContent = 'העלאת תמונה';
  input.value = '';
}

function openBlogGalleryPicker() {
  const blogImages = galleryItems.filter(i => i.category === 'בלוג' && i.type !== 'video');

  const overlay = document.createElement('div');
  overlay.id = 'blog-gallery-picker';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;';

  const gridHTML = blogImages.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">אין תמונות בקטגוריית בלוג</div>`
    : blogImages.map((item, i) => {
        const realIndex = galleryItems.indexOf(item);
        return `
        <div style="position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:#f5f5f5;aspect-ratio:1;cursor:pointer;"
             onclick="selectImageFromGalleryPicker('${item.url}')">
          <img src="${item.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="${item.name}">
          <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;flex-direction:column;justify-content:flex-end;padding:6px;gap:3px;opacity:0;transition:all 0.2s;"
               onmouseenter="this.style.background='rgba(0,0,0,0.55)';this.style.opacity='1'"
               onmouseleave="this.style.background='rgba(0,0,0,0)';this.style.opacity='0'">
            <button onclick="event.stopPropagation();copyGalleryUrl('${item.url}')" style="background:var(--orange-deep);color:#fff;border:none;width:100%;padding:6px;border-radius:6px;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">העתק קישור</button>
            <button onclick="event.stopPropagation();deleteGalleryItem(${realIndex});document.getElementById('blog-gallery-picker').remove();setTimeout(openBlogGalleryPicker,300)" style="background:rgba(220,38,38,0.85);color:#fff;border:none;width:100%;padding:5px;border-radius:6px;font-family:inherit;font-size:0.68rem;font-weight:600;cursor:pointer;">מחק</button>
          </div>
        </div>`;
      }).join('');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:24px;width:100%;max-width:780px;max-height:88vh;display:flex;flex-direction:column;gap:16px;direction:rtl;box-shadow:0 8px 40px rgba(0,0,0,0.2);">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:1.05rem;font-weight:800;color:var(--navy)">בחירה מגלריית בלוג</div>
        <button onclick="document.getElementById('blog-gallery-picker').remove()" style="background:none;border:none;cursor:pointer;font-size:1.3rem;color:var(--text-mid);line-height:1;">✕</button>
      </div>
      <div style="font-size:0.78rem;color:var(--text-light)">לחצו על תמונה כדי לבחור אותה</div>
      <div style="overflow-y:auto;flex:1;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;">
          ${gridHTML}
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
}

function selectImageFromGalleryPicker(url) {
  document.getElementById('bf-image').value = url;
  const preview = document.getElementById('bf-image-preview');
  if (preview) {
    preview.style.display = 'block';
    preview.querySelector('img').src = url;
  }
  document.getElementById('blog-gallery-picker')?.remove();
}

function clearPostImage() {
  document.getElementById('bf-image').value = '';
  const preview = document.getElementById('bf-image-preview');
  preview.style.display = 'none';
  preview.querySelector('img').src = '';
}

function blogAutoSlug() {
  const title = document.getElementById('bf-title')?.innerHTML || '';
  const slug = titleToSlug(title);
  const idField = document.getElementById('bf-id');
  if (idField && !blogEditingId && !idField.value.trim() && idField.dataset.cleared !== '1') idField.value = slug;
  const preview = document.getElementById('bf-slug-preview');
  if (preview) preview.textContent = slug ? 'post.html?id=' + slug : '';
}

function blogAutoSeo() {
  const title = document.getElementById('bf-title')?.innerHTML || '';
  const excerpt = document.getElementById('bf-excerpt')?.innerHTML || '';
  const seoTitle = document.getElementById('bf-seo-title');
  const seoDesc = document.getElementById('bf-seo-desc');
  if (seoTitle && !seoTitle.dataset.edited && seoTitle.dataset.cleared !== '1') seoTitle.value = title ? title + ' | עומר טייכר' : '';
  if (seoDesc && !seoDesc.dataset.edited && seoDesc.dataset.cleared !== '1') seoDesc.value = excerpt;
}

function titleToSlug(title) {
  return title.trim()
    .replace(/[\s\u0590-\u05FF\uFB1D-\uFB4F]+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatBlogDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

async function blogSendWhatsapp(postId) {
  const post = blogPosts.find(p => p.id === postId);
  if (!post) return;

  const excerpt = post.excerpt.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
  const url = 'https://blog.omertai.net/post.html?id=' + post.id;
  const message = 'היי חברים, בוקר טוב ☀️\nפוסט חדש עלה:\n\n' + excerpt + '\n\n' + url;

  const instanceId = '7105234514';
  const apiToken = '3ce48a9a896443f3a7f6698f4a6012936c7dc288199e4ec19c';
  const apiUrl = 'https://7105.api.greenapi.com';
  const chatId = '972526587420@c.us';

  try {
    setStatus('content', 'loading', 'שולח לוואטסאפ...');
    const res = await fetch(`${apiUrl}/waInstance${instanceId}/sendMessage/${apiToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message })
    });
    const data = await res.json();
    if (data.idMessage) {
      setStatus('content', 'ok', '✓ נשלח לוואטסאפ');
    } else {
      setStatus('content', 'error', 'שגיאה: ' + JSON.stringify(data));
    }
  } catch(e) {
    setStatus('content', 'error', 'שגיאה בשליחה: ' + e.message);
  }
}


async function blogCancelSchedule(postId) {
  if (!confirm('לבטל את התזמון לפוסט זה?')) return;
  try {
    setStatus('content', 'loading', 'מבטל תזמון...');
    const SITE_REPO = 'omer-taicher-site';
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${SITE_REPO}/contents/scheduled.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    const data = await res.json();
    const scheduledSha = data.sha;
    let scheduled = JSON.parse(decode(data.content));
    scheduled = scheduled.filter(s => !(s.postId === postId && !s.sent));
    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${SITE_REPO}/contents/scheduled.json`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ביטול תזמון: ' + postId, content: btoa(unescape(encodeURIComponent(JSON.stringify(scheduled, null, 2)))), sha: scheduledSha, branch: GITHUB_BRANCH })
    });
    const result = await putRes.json();
    if (result.content) {
      blogScheduled = scheduled.filter(s => !s.sent);
      setStatus('content', 'ok', '✓ התזמון בוטל');
      renderBlogList();
    } else {
      setStatus('content', 'error', 'שגיאה: ' + (result.message || ''));
    }
  } catch(e) {
    setStatus('content', 'error', 'שגיאה: ' + e.message);
  }
}

async function blogScheduleWhatsapp(postId) {
  const post = blogPosts.find(p => p.id === postId);
  if (!post) return;

  // overlay
  const overlay = document.createElement('div');
  overlay.id = 'schedule-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center';

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  const defaultDate = tomorrow.toISOString().slice(0,10);

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;width:320px;direction:rtl;font-family:Rubik,sans-serif">
      <div style="font-size:1rem;font-weight:700;color:#1a4a6b;margin-bottom:4px">תזמון הודעה לוואטסאפ</div>
      <div style="font-size:0.82rem;color:#888;margin-bottom:20px">${post.title.replace(/<[^>]+>/g,'')}</div>
      <label style="font-size:0.82rem;font-weight:600;color:#555;display:block;margin-bottom:6px">תאריך</label>
      <input id="schedule-date" type="date" value="${defaultDate}" style="width:100%;padding:8px 12px;border:1px solid #e0d6cc;border-radius:8px;font-size:0.9rem;margin-bottom:14px;box-sizing:border-box;font-family:inherit">
      <label style="font-size:0.82rem;font-weight:600;color:#555;display:block;margin-bottom:6px">שעה</label>
      <input id="schedule-time" type="time" value="08:00" style="width:100%;padding:8px 12px;border:1px solid #e0d6cc;border-radius:8px;font-size:0.9rem;margin-bottom:20px;box-sizing:border-box;font-family:inherit">
      <div style="display:flex;gap:10px">
        <button id="schedule-confirm" style="flex:1;background:#128c7e;color:#fff;border:none;padding:10px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">תזמן</button>
        <button id="schedule-cancel" style="flex:1;background:#f5ede0;color:#555;border:none;padding:10px;border-radius:20px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">ביטול</button>
      </div>
      <div id="schedule-status" style="margin-top:12px;font-size:0.82rem;text-align:center;color:#888"></div>
    </div>`;

  document.body.appendChild(overlay);
  document.getElementById('schedule-cancel').onclick = () => overlay.remove();

  document.getElementById('schedule-confirm').onclick = async () => {
    const date = document.getElementById('schedule-date').value;
    const time = document.getElementById('schedule-time').value;
    if (!date || !time) return;

    const sendAtLocal = new Date(date + 'T' + time + ':00');
    const sendAt = sendAtLocal.toISOString().slice(0, 19);
    const statusEl = document.getElementById('schedule-status');
    statusEl.textContent = 'שומר...';

    try {
      // טוען scheduled.json מ-omer-taicher-site תמיד
      const SITE_REPO = 'omer-taicher-site';
      let scheduled = [];
      let scheduledSha = null;
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${SITE_REPO}/contents/scheduled.json?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
          headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        const data = await res.json();
        scheduledSha = data.sha;
        scheduled = JSON.parse(decode(data.content));
      } catch(e) { scheduledSha = null; }

      // מוסיף רשומה
      scheduled.push({ postId, sendAt, sent: false, addedAt: new Date().toISOString() });

      const putRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${SITE_REPO}/contents/scheduled.json`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'תזמון פוסט: ' + postId, content: btoa(unescape(encodeURIComponent(JSON.stringify(scheduled, null, 2)))), sha: scheduledSha, branch: GITHUB_BRANCH })
      });
      const result = await putRes.json();
      if (result.content) {
        statusEl.style.color = '#128c7e';
        statusEl.textContent = '✓ מתוזמן ל-' + time + ' בתאריך ' + date;
        setTimeout(() => overlay.remove(), 1500);
      } else {
        statusEl.style.color = '#c0392b';
        statusEl.textContent = 'שגיאה: ' + (result.message || '');
      }
    } catch(e) {
      statusEl.style.color = '#c0392b';
      statusEl.textContent = 'שגיאה: ' + e.message;
    }
  };
}


async function blogSavePost() {
  const btn = document.getElementById('bf-save-btn') || document.getElementById('bf-save-btn-bottom');
  const alertEl = document.getElementById('bf-alert');
  const title   = document.getElementById('bf-title')?.innerHTML?.trim();
  const excerpt = document.getElementById('bf-excerpt')?.innerHTML?.trim();
  const body    = document.getElementById('bf-body')?.innerHTML.trim();
  const date    = document.getElementById('bf-date')?.value;
  const image   = document.getElementById('bf-image')?.value.trim() || '';
  const id = document.getElementById('bf-id')?.value.trim() || blogEditingId || titleToSlug(title);
  const seoTitle = document.getElementById('bf-seo-title')?.value.trim() ?? '';
  const seoDesc  = document.getElementById('bf-seo-desc')?.value.trim() ?? '';
  const imageAlt = document.getElementById('bf-image-alt')?.value.trim() ?? '';

  if (!title)   { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">כותרת היא שדה חובה</div>'; return; }
  if (!excerpt) { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תקציר הוא שדה חובה</div>'; return; }
  if (!body)    { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">גוף הפוסט הוא שדה חובה</div>'; return; }
  if (!date)    { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תאריך הוא שדה חובה</div>'; return; }
  if (!id)      { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">URL Slug הוא שדה חובה — מלאו אותו באנגלית</div>'; document.getElementById("bf-id")?.focus(); return; }

  btn.disabled = true;
  btn.textContent = 'שומר...';
  setStatus('content', 'loading', 'מפרסם פוסט...');

  try {
    // טעינה מחדש לקבלת SHA עדכני
    const fresh = await ghGet('posts.json');
    blogSha = fresh.sha;
    const freshData = JSON.parse(decode(fresh.content));
    let posts = freshData.posts || [];

    const post = { id, title, excerpt, body, date, image, image_alt: imageAlt, seo_title: seoTitle, seo_desc: seoDesc };

    if (blogEditingId) {
      const idx = posts.findIndex(p => p.id === blogEditingId);
      if (idx === -1) throw new Error('הפוסט לא נמצא');
      posts[idx] = post;
    } else {
      if (posts.some(p => p.id === id)) throw new Error('כבר קיים פוסט עם ID: ' + id);
      posts.unshift(post);
    }

    const result = await ghPut('posts.json', JSON.stringify({ posts }, null, 2), blogSha, (blogEditingId ? 'עריכת' : 'פוסט חדש:') + ' ' + title);
    if (result.content) {
      blogSha = result.content.sha;
      blogPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStatus('content', 'ok', '✓ ' + (blogEditingId ? 'הפוסט עודכן' : 'הפוסט פורסם') + '! Vercel מפרסם...');
      loadBlogManager();
    } else {
      throw new Error(result.message || 'שגיאה לא ידועה');
    }
  } catch(e) {
    alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">שגיאה: ' + e.message + '</div>';
    setStatus('content', 'error', 'שגיאה: ' + e.message);
    btn.disabled = false;
    btn.textContent = blogEditingId ? 'שמור שינויים' : 'פרסם';
  }
}

function blogDeletePost(id) {
  const post = blogPosts.find(p => p.id === id);
  if (!post) return;
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-modal-text').textContent = 'למחוק את הפוסט "' + post.title + '"?';
  modal.style.display = 'flex';
  document.getElementById('confirm-modal-yes').onclick = async () => {
    modal.style.display = 'none';
    setStatus('content', 'loading', 'מוחק פוסט...');
    try {
      const fresh = await ghGet('posts.json');
      blogSha = fresh.sha;
      const freshData = JSON.parse(decode(fresh.content));
      const posts = (freshData.posts || []).filter(p => p.id !== id);
      const result = await ghPut('posts.json', JSON.stringify({ posts }, null, 2), blogSha, 'מחיקת פוסט: ' + id);
      if (result.content) {
        blogSha = result.content.sha;
        blogPosts = posts;
        setStatus('content', 'ok', '✓ הפוסט נמחק');
        renderBlogList();
      } else {
        throw new Error(result.message || 'שגיאה');
      }
    } catch(e) {
      setStatus('content', 'error', 'שגיאה: ' + e.message);
    }
  };
  document.getElementById('confirm-modal-no').onclick = () => { modal.style.display = 'none'; };
}

// ─── הדבק פוסט מהלוח (ממיר טקסט Wix ל-HTML) ───────────────────────────────

function updateBodyPreview() {
  // bf-body is contenteditable — nothing to update, it renders inline
}

function parseRawPost(raw) {
  // מנקה תווים מיוחדים ומחלק לשורות
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').map(l => l.trim());

  // מזהה אמוג'י בשורה הראשונה
  const emojiMatch = lines[0].match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/u);
  const emoji = emojiMatch ? emojiMatch[0] : '';

  // כותרת = שורה ראשונה: מסיר מספר מוביל (כמו "1 . " או "12."), ומסיר אימוג'ים
  let titleRaw = lines[0]
    .replace(/^\d+\s*[.\-–]\s*/, '')           // מספר מוביל
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '') // אימוג'ים
    .replace(/[★☆✓✔✗✘]/g, '')
    .trim();

  // תאריך — מחפש שורה שמתחילה ב-* או מכילה "בינו׳/בפבר׳/במרץ" וכו'
  let dateISO = todayISO();
  const heMonths = {
    'בינו׳': '01', 'בפבר׳': '02', 'במרץ': '03', 'באפר׳': '04',
    'במאי': '05', 'ביוני': '06', 'ביולי': '07', 'באוג׳': '08',
    'בספט׳': '09', 'באוק׳': '10', 'בנוב׳': '11', 'בדצמ׳': '12',
    'ינואר': '01', 'פברואר': '02', 'מרץ': '03', 'אפריל': '04',
    'מאי': '05', 'יוני': '06', 'יולי': '07', 'אוגוסט': '08',
    'ספטמבר': '09', 'אוקטובר': '10', 'נובמבר': '11', 'דצמבר': '12'
  };
  for (let i = 1; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    for (const [heb, num] of Object.entries(heMonths)) {
      const m = l.match(new RegExp('(\\d{1,2})\\s+' + heb + '(?:\\s+(\\d{4}))?'));
      if (m) {
        const day = m[1].padStart(2, '0');
        const year = m[2] || '2025';
        dateISO = `${year}-${num}-${day}`;
        break;
      }
    }
  }

  // גוף — מדלג על שורה 0 (כותרת) ושורות תאריך/כוכבית בהתחלה
  let bodyStartIdx = 1;
  while (bodyStartIdx < lines.length && (
    lines[bodyStartIdx] === '' ||
    /^\*/.test(lines[bodyStartIdx]) ||
    /^\d+\s+ב/.test(lines[bodyStartIdx])
  )) {
    bodyStartIdx++;
  }

  // אוסף קבוצות שורות — כל ריצה של שורות לא-ריקות = בלוק
  const blocks = [];
  let current = [];
  for (let i = bodyStartIdx; i < lines.length; i++) {
    const line = lines[i];
    // מסיר אימוג'ים מהשורות
    const clean = line
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/[★☆✓✔✗✘]/g, '')
      .replace(/^[0-9️⃣]+[️⃣]\s*/g, '')   // מספרים עם אימוג'י
      .replace(/^[\*\•\-]\s+/, '')         // נקודות רשימה
      .replace(/^[➡⬅⬇⬆▶◀]\s*/g, '')
      .trim();
    if (clean === '') {
      if (current.length > 0) { blocks.push(current); current = []; }
    } else {
      current.push(clean);
    }
  }
  if (current.length > 0) blocks.push(current);

  // ממיר בלוקים ל-HTML — שורה בודדת קצרה = <h2>, אחרת = <p> עם <br> בין שורות
  const bodyParts = blocks.map(block => {
    const text = block.join(' ');
    if (block.length === 1 && text.length < 70 && !text.endsWith('.') && !text.endsWith(',') && !text.endsWith('?')) {
      return `<h2>${text}</h2>`;
    }
    return `<p>${block.join('<br>')}</p>`;
  });

  const body = bodyParts.join('\n');

  // תקציר — הבלוק הראשון שהוא לא h2, עד 180 תווים
  let excerptText = '';
  for (const block of blocks) {
    const t = block.join(' ');
    if (t.length >= 20) { excerptText = t; break; }
  }
  const excerpt = excerptText.length > 180 ? excerptText.slice(0, 177) + '...' : excerptText;

  // ID אוטומטי מהכותרת
  const id = titleRaw
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\u0590-\u05FF\-]/g, '')
    .toLowerCase()
    .slice(0, 60);

  return {
    id,
    title: titleRaw,
    excerpt,
    body,
    date: dateISO,
    emoji,
    image: '',
    image_alt: '',
    seo_title: titleRaw + ' | עומר טייכר',
    seo_desc: excerpt.slice(0, 155)
  };
}

async function blogPasteFromClipboard() {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch(e) {
    alert('לא ניתן לקרוא מהלוח. ודאו שאישרתם גישה ללוח בדפדפן.');
    return;
  }

  if (!text || !text.trim()) {
    alert('הלוח ריק. העתיקו את הפוסט ונסו שוב.');
    return;
  }

  let post;
  try {
    const parsed = JSON.parse(text.trim());
    post = {
      id:        parsed.id        || '',
      title:     parsed.title     || '',
      excerpt:   parsed.excerpt   || '',
      body:      parsed.body      || '',
      date:      parsed.date      || todayISO(),
      emoji:     parsed.emoji     || '',
      image:     parsed.image     || '',
      image_alt: parsed.image_alt || '',
      seo_title: parsed.seo_title || (parsed.title ? parsed.title + ' | עומר טייכר' : ''),
      seo_desc:  parsed.seo_desc  || parsed.excerpt || ''
    };
  } catch(e) {
    post = parseRawPost(text);
  }

  blogEditingId = null;
  showBlogForm(post);
  setTimeout(updateBodyPreview, 50);
}


// ===== INTERACTIVE TUTORIALS MANAGEMENT =====
let interactiveItems = [];
let interactiveSha = null;
let interactiveEditingIndex = null;

async function loadInteractiveManager() {
  setStatus('content', 'loading', 'טוען הדרכות...');
  const container = document.getElementById('interactive-list');
  if (!container) return;
  try {
    const data = await ghGet('interactive.json');
    interactiveSha = data.sha;
    interactiveItems = JSON.parse(decode(data.content));
    renderInteractiveList();
    setStatus('content', 'ok', interactiveItems.length + ' הדרכות נטענו');
  } catch(e) {
    setStatus('content', 'error', 'שגיאה: ' + e.message);
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#c0392b;font-size:0.88rem">שגיאה בטעינת הדרכות: ' + e.message + '</div>';
  }
}

function renderInteractiveList() {
  const container = document.getElementById('interactive-list');
  const count = document.getElementById('interactive-count');
  if (count) count.textContent = interactiveItems.length + ' הדרכות';

  if (!interactiveItems.length) {
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-light);font-size:0.88rem">אין הדרכות עדיין. לחץ + הדרכה חדשה.</div>';
    return;
  }

  container.innerHTML = interactiveItems.map((item, i) => `
    <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
      <div style="width:44px;height:44px;background:linear-gradient(135deg,#1a4a6b,#1e5f74);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.title}</div>
        <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${item.steps} שלבים · ${item.desc}</div>
        <div style="font-size:0.68rem;color:var(--text-light);direction:ltr;text-align:right;margin-top:2px">${item.url}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button onclick="interactiveEditItem(${i})" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
        <button onclick="window.open('${item.url}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">פתח</button>
        <button onclick="interactiveDeleteItem(${i})" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
      </div>
    </div>
  `).join('');
}

function interactiveNewItem() {
  interactiveEditingIndex = null;
  showInteractiveForm({ title: '', desc: '', steps: '', url: '', price: '', category: '' });
}

function interactiveEditItem(index) {
  interactiveEditingIndex = index;
  showInteractiveForm(interactiveItems[index]);
}

function showInteractiveForm(item) {
  const container = document.getElementById('interactive-list');
  const count = document.getElementById('interactive-count');
  if (count) count.style.display = 'none';

  container.innerHTML = `
    <div style="margin-bottom:18px;display:flex;align-items:center;gap:12px">
      <button onclick="loadInteractiveManager()" style="background:var(--cream);color:var(--navy);border:1px solid var(--border);padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">→ חזרה לרשימה</button>
      <div style="font-size:0.95rem;font-weight:800;color:var(--navy)">${interactiveEditingIndex !== null ? 'עריכת הדרכה' : 'הדרכה חדשה'}</div>
    </div>

    <div class="field"><label class="field-label">כותרת *</label><textarea id="if-title" rows="2">${item.title}</textarea></div>
    <div class="field"><label class="field-label">תיאור קצר *</label><textarea id="if-desc" rows="2">${item.desc}</textarea></div>
    <div class="fields-row">
      <div class="field"><label class="field-label">מספר שלבים *</label><input id="if-steps" type="number" min="1" value="${item.steps}" style="direction:ltr;text-align:left"></div>
      <div class="field"><label class="field-label">קטגוריה</label><input id="if-category" type="text" value="${item.category || ''}" placeholder="לדוגמה: AI · תמלול · Windows"></div>
    </div>
    <div class="field"><label class="field-label">קישור להדרכה *</label><input id="if-url" type="text" value="${item.url}" style="direction:ltr;text-align:left" placeholder="./Vibe/index.html"></div>
    <div class="fields-row">
      <div class="field"><label class="field-label">מחיר (₪)</label><input id="if-price" type="number" min="0" value="${item.price || ''}" style="direction:ltr;text-align:left" placeholder="97"></div>
      <div class="field"><label class="field-label">סטטוס</label>
        <select id="if-status" style="padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-family:inherit;font-size:0.88rem;background:#fff;">
          <option value="active" ${(item.status||'active')==='active'?'selected':''}>פעיל — זמין לרכישה</option>
          <option value="coming_soon" ${item.status==='coming_soon'?'selected':''}>בקרוב</option>
          <option value="hidden" ${item.status==='hidden'?'selected':''}>מוסתר</option>
        </select>
      </div>
    </div>

    <div style="margin-top:24px;display:flex;gap:12px;align-items:center">
      <button onclick="interactiveSaveItem()" id="if-save-btn" style="background:var(--orange-deep);color:#fff;border:none;padding:12px 32px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit">${interactiveEditingIndex !== null ? 'שמור שינויים' : 'הוסף הדרכה'}</button>
      <button onclick="loadInteractiveManager()" style="background:transparent;color:var(--text-mid);border:1px solid var(--border);padding:11px 24px;border-radius:50px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>
    <div id="if-alert" style="margin-top:14px"></div>
  `;
}

async function interactiveSaveItem() {
  const btn = document.getElementById('if-save-btn');
  const alertEl = document.getElementById('if-alert');
  const title    = document.getElementById('if-title')?.value.trim();
  const desc     = document.getElementById('if-desc')?.value.trim();
  const steps    = parseInt(document.getElementById('if-steps')?.value);
  const url      = document.getElementById('if-url')?.value.trim();
  const price    = document.getElementById('if-price')?.value.trim();
  const category = document.getElementById('if-category')?.value.trim();
  const status   = document.getElementById('if-status')?.value;

  if (!title) { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">כותרת היא שדה חובה</div>'; return; }
  if (!desc)  { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תיאור הוא שדה חובה</div>'; return; }
  if (!steps) { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">מספר שלבים הוא שדה חובה</div>'; return; }
  if (!url)   { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">קישור להדרכה הוא שדה חובה</div>'; return; }

  btn.disabled = true;
  btn.textContent = 'שומר...';
  setStatus('content', 'loading', 'שומר הדרכה...');

  try {
    const fresh = await ghGet('interactive.json');
    interactiveSha = fresh.sha;
    interactiveItems = JSON.parse(decode(fresh.content));

    const newItem = { title, desc, steps, url, price: price ? parseInt(price) : null, category, status };

    if (interactiveEditingIndex !== null) {
      interactiveItems[interactiveEditingIndex] = newItem;
    } else {
      interactiveItems.push(newItem);
    }

    const result = await ghPut('interactive.json', JSON.stringify(interactiveItems, null, 2), interactiveSha,
      (interactiveEditingIndex !== null ? 'עריכת הדרכה: ' : 'הדרכה חדשה: ') + title);

    if (result.content) {
      interactiveSha = result.content.sha;
      setStatus('content', 'ok', '✓ נשמר! Vercel מפרסם...');
      loadInteractiveManager();
    } else {
      throw new Error(result.message || 'שגיאה לא ידועה');
    }
  } catch(e) {
    alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">שגיאה: ' + e.message + '</div>';
    setStatus('content', 'error', 'שגיאה: ' + e.message);
    btn.disabled = false;
    btn.textContent = interactiveEditingIndex !== null ? 'שמור שינויים' : 'הוסף הדרכה';
  }
}

function interactiveDeleteItem(index) {
  const item = interactiveItems[index];
  if (!item) return;
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-modal-text').textContent = 'למחוק את ההדרכה "' + item.title + '"?';
  modal.style.display = 'flex';
  document.getElementById('confirm-modal-yes').onclick = async () => {
    modal.style.display = 'none';
    setStatus('content', 'loading', 'מוחק הדרכה...');
    try {
      const fresh = await ghGet('interactive.json');
      interactiveSha = fresh.sha;
      const items = JSON.parse(decode(fresh.content)).filter((_, i) => i !== index);
      const result = await ghPut('interactive.json', JSON.stringify(items, null, 2), interactiveSha, 'מחיקת הדרכה: ' + item.title);
      if (result.content) {
        interactiveSha = result.content.sha;
        interactiveItems = items;
        setStatus('content', 'ok', '✓ ההדרכה נמחקה');
        renderInteractiveList();
      } else {
        throw new Error(result.message || 'שגיאה');
      }
    } catch(e) {
      setStatus('content', 'error', 'שגיאה: ' + e.message);
    }
  };
  document.getElementById('confirm-modal-no').onclick = () => { modal.style.display = 'none'; };
}


// ===== GALLERY / MEDIA MANAGER =====

let galleryItems = []; // [{url, type, name, date, category}]
let galleryFilter = 'הכל';

let gallerySha = null;

async function loadGalleryManager() {
  setStatus('gallery', 'loading', 'טוען...');
  try {
    // טעינת קטגוריות מ-gallery.json
    let categories = {};
    let order = [];
    try {
      const data = await ghGet('gallery.json');
      gallerySha = data.sha;
      const saved = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
      categories = saved.categories || {};
      order = saved.order || [];
    } catch(e) {
      gallerySha = null;
    }
    // קבצים מה-Worker בלבד
    const res = await fetch(WORKER_URL);
    if (res.ok) {
      const workerData = await res.json();
      const workerItems = workerData.items || [];
      const mapped = workerItems.map(wi => {
        const resourceType = /\.(mp4|mov|webm|avi)$/i.test(wi.key) ? 'video' : 'image';
        return {
          url: wi.url,
          type: resourceType,
          name: wi.key,
          key: wi.key,
          category: categories[wi.key] || 'כללי',
          date: wi.uploaded || ''
        };
      });
      // סדר לפי order השמור, קבצים חדשים בסוף
      if (order && order.length) {
        const orderMap = {};
        order.forEach((key, i) => orderMap[key] = i);
        mapped.sort((a, b) => {
          const ia = orderMap[a.key] !== undefined ? orderMap[a.key] : 9999;
          const ib = orderMap[b.key] !== undefined ? orderMap[b.key] : 9999;
          return ia - ib;
        });
      }
      galleryItems = mapped;
    } else {
      galleryItems = [];
    }
    renderGallery();
    updateGalleryFilterCounts();
    setStatus('gallery', 'ok', galleryItems.length + ' פריטים');
  } catch(e) {
    galleryItems = [];
    renderGallery();
    setStatus('gallery', 'error', 'שגיאה בטעינה');
  }
}

function filterGallery(cat) {
  galleryFilter = cat;
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.classList.toggle('gallery-filter-active', btn.dataset.cat === cat);
  });
  renderGallery();
}

function updateGalleryFilterCounts() {
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    const cat = btn.dataset.cat;
    const count = cat === 'הכל' ? galleryItems.length : galleryItems.filter(i => i.category === cat).length;
    // שמור את הטקסט המקורי בלי ספירה
    const baseText = btn.dataset.label || btn.textContent.replace(/\s*\(\d+\)$/, '').trim();
    btn.dataset.label = baseText;
    btn.textContent = `${baseText} (${count})`;
  });
}

let selectedGalleryItems = new Set();

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  if (!grid) return;

  const filtered = galleryFilter === 'הכל'
    ? galleryItems
    : galleryItems.filter(i => i.category === galleryFilter);

  if (!filtered.length) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    updateMultiDeleteBtn();
    return;
  }

  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';

  grid.innerHTML = filtered.map((item) => {
    const realIndex = galleryItems.indexOf(item);
    const isSelected = selectedGalleryItems.has(realIndex);
    return `
    <div onclick="toggleGallerySelect(${realIndex}, event)" style="position:relative;border-radius:12px;overflow:hidden;border:${isSelected ? '3px solid var(--orange-deep)' : '1px solid var(--border)'};background:#f5f5f5;aspect-ratio:1;cursor:pointer;" id="gitem-${realIndex}">
      ${item.type === 'video'
        ? `<video src="${item.url}" style="width:100%;height:100%;object-fit:cover;" muted preload="metadata"></video>
           <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;font-size:0.6rem;padding:2px 6px;border-radius:6px;font-weight:700;">וידאו</div>`
        : `<img src="${item.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="${item.name}">`
      }
      ${isSelected ? `<div style="position:absolute;top:6px;right:6px;background:var(--orange-deep);color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;">✓</div>` : ''}
      <div style="position:absolute;top:6px;left:6px;background:var(--orange-deep);color:#fff;font-size:0.58rem;padding:2px 7px;border-radius:50px;font-weight:700;">${item.category || ''}</div>
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;flex-direction:column;justify-content:flex-end;padding:8px;gap:4px;opacity:0;transition:all 0.2s;"
           onmouseenter="this.style.background='rgba(0,0,0,0.55)';this.style.opacity='1'"
           onmouseleave="this.style.background='rgba(0,0,0,0)';this.style.opacity='0'">
        <button onclick="event.stopPropagation();window.open('${item.url}','_blank')" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.4);width:100%;padding:6px;border-radius:6px;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">פתח בלשונית</button>
        <button onclick="event.stopPropagation();copyGalleryUrl('${item.url}')" style="background:var(--orange-deep);color:#fff;border:none;width:100%;padding:6px;border-radius:6px;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">העתק קישור</button>
        <button onclick="event.stopPropagation();deleteGalleryItem(${realIndex})" style="background:rgba(220,38,38,0.85);color:#fff;border:none;width:100%;padding:5px;border-radius:6px;font-family:inherit;font-size:0.68rem;font-weight:600;cursor:pointer;">מחק</button>
      </div>
    </div>`;
  }).join('');

  updateMultiDeleteBtn();
}

function toggleGallerySelect(index, e) {
  if (e.target.tagName === 'BUTTON') return;
  if (selectedGalleryItems.has(index)) {
    selectedGalleryItems.delete(index);
  } else {
    selectedGalleryItems.add(index);
  }
  renderGallery();
}

function toggleSelectAll() {
  const filtered = galleryFilter === 'הכל'
    ? galleryItems
    : galleryItems.filter(i => i.category === galleryFilter);
  const allSelected = filtered.every((item) => selectedGalleryItems.has(galleryItems.indexOf(item)));
  filtered.forEach((item) => {
    const idx = galleryItems.indexOf(item);
    if (allSelected) selectedGalleryItems.delete(idx);
    else selectedGalleryItems.add(idx);
  });
  renderGallery();
}

function downloadSelectedGalleryItems() {
  if (!selectedGalleryItems.size) return;
  const items = [...selectedGalleryItems].map(i => galleryItems[i]).filter(Boolean);
  items.forEach((item, i) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = item.name || item.key || 'image';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, i * 400);
  });
}

function moveSelectedToCategory() {
  const cat = document.getElementById('gallery-move-select')?.value;
  if (!cat) return;
  selectedGalleryItems.forEach(idx => {
    if (galleryItems[idx]) galleryItems[idx].category = cat;
  });
  selectedGalleryItems.clear();
  renderGallery();
  autoSaveGallery();
  document.getElementById('gallery-move-select').value = '';
}

function updateMultiDeleteBtn() {
  let btn = document.getElementById('gallery-multi-delete');
  if (!btn) return;
  const downloadBtn = document.getElementById('gallery-multi-download');
  const selectAllBtn = document.getElementById('gallery-select-all');
  const selectAllLabel = document.getElementById('gallery-select-all-label');
  const filtered = galleryFilter === 'הכל'
    ? galleryItems
    : galleryItems.filter(i => i.category === galleryFilter);
  const allSelected = filtered.length > 0 && filtered.every((item) => selectedGalleryItems.has(galleryItems.indexOf(item)));

  if (selectAllLabel) selectAllLabel.textContent = allSelected ? 'בטל סימון' : 'סמן הכל';
  if (selectAllBtn) {
    const rect = selectAllBtn.querySelector('svg rect');
    if (rect) rect.setAttribute('fill', allSelected ? 'var(--navy)' : 'none');
  }

  if (selectedGalleryItems.size > 0) {
    btn.style.display = 'inline-flex';
    btn.textContent = `🗑️ מחק ${selectedGalleryItems.size} נבחרים`;
    if (downloadBtn) downloadBtn.style.display = 'inline-flex';
    const moveDiv = document.getElementById('gallery-multi-move');
    if (moveDiv) moveDiv.style.display = 'inline-flex';
  } else {
    btn.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
    const moveDiv = document.getElementById('gallery-multi-move');
    if (moveDiv) moveDiv.style.display = 'none';
  }
}

async function deleteSelectedGalleryItems() {
  if (!selectedGalleryItems.size) return;
  if (!confirm(`למחוק ${selectedGalleryItems.size} קבצים לצמיתות?`)) return;

  const indices = Array.from(selectedGalleryItems).sort((a, b) => b - a);
  for (const index of indices) {
    const item = galleryItems[index];
    try {
      const key = item.url.replace('https://media.omertai.net/', '');
      await fetch(`${WORKER_URL}/${key}`, { method: 'DELETE' });
    } catch(e) { console.error(e); }
    galleryItems.splice(index, 1);
  }

  selectedGalleryItems.clear();
  renderGallery();
  setStatus('gallery', 'loading', 'שומר...');
  await autoSaveGallery();
}

function triggerGalleryUpload() {
  document.getElementById('gallery-file-input').click();
}

async function uploadGalleryFiles(input) {
  const files = Array.from(input.files);
  if (!files.length) return;

  const category = document.getElementById('gallery-category-select').value;
  const btn = document.getElementById('gallery-upload-btn');
  btn.disabled = true;
  btn.innerHTML = 'מעלה...';
  setStatus('gallery', 'loading', 'מעלה ' + files.length + ' קבצים...');

  let uploaded = 0;
  for (const file of files) {
    try {
      const key = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const res = await fetch(`${WORKER_URL}/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      const data = await res.json();
      if (data.url) {
        const resourceType = file.type.startsWith('video') ? 'video' : 'image';
        galleryItems.unshift({
          url: data.url,
          type: resourceType,
          name: file.name,
          category: category,
          date: new Date().toISOString()
        });
        uploaded++;
      }
    } catch(e) {
      console.error('שגיאה בהעלאת', file.name, e);
    }
  }

  renderGallery();
  setStatus('gallery', 'loading', '✓ ' + uploaded + ' הועלו — שומר לאתר...');
  await autoSaveGallery();

  btn.disabled = false;
  btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> העלאת קובץ';
  input.value = '';
}

async function autoSaveGallery() {
  try {
    // תמיד רענן SHA לפני שמירה
    try {
      const fresh = await ghGet('gallery.json');
      gallerySha = fresh.sha;
    } catch(e) { gallerySha = null; }
    const categories = {};
    const order = galleryItems.map(i => i.key).filter(k => typeof k === 'string' && k.length > 0);
    galleryItems.forEach(item => {
      if (item.key && item.category && item.category !== 'כללי') {
        categories[item.key] = item.category;
      }
    });
    const json = JSON.stringify({ categories, order }, null, 2);
    const result = await ghPut('gallery.json', json, gallerySha, 'עדכון קטגוריות גלריה');
    if (result.content) {
      gallerySha = result.content.sha;
      setStatus('gallery', 'ok', '✓ נשמר');
    } else {
      setStatus('gallery', 'error', 'שגיאה בשמירה: ' + (result.message || ''));
    }
  } catch(e) {
    setStatus('gallery', 'error', 'שגיאה בשמירה');
    console.error(e);
  }
}

function copyGalleryUrl(url) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => setStatus('gallery', 'ok', '✓ הקישור הועתק ללוח'))
      .catch(() => fallbackCopy(url, 'קישור'));
  } else {
    fallbackCopy(url, 'קישור');
  }
}

async function deleteGalleryItem(index) {
  if (!confirm('למחוק את הקובץ לצמיתות?')) return;
  const item = galleryItems[index];

  try {
    const key = item.url.replace('https://media.omertai.net/', '');
    await fetch(`${WORKER_URL}/${key}`, { method: 'DELETE' });
  } catch(e) {
    console.error('שגיאה במחיקה', e);
  }

  galleryItems.splice(index, 1);
  renderGallery();
  setStatus('gallery', 'loading', 'מוחק ושומר...');
  await autoSaveGallery();
}


// ===== DOWNLOAD / גיבוי אתר =====

function initDownloadTab() {
  renderDownloadList();
}

function renderDownloadList() {
  const container = document.getElementById('download-repo-list');
  if (!container) return;

  container.innerHTML = Object.entries(REPOS).map(([repoKey, repoMeta]) => {
    return `
      <div style="background:white;border:1px solid var(--border,#e2e8f0);border-radius:12px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.95rem;">${repoMeta.name}</div>
          <div style="font-family:monospace;font-size:0.7rem;color:var(--muted,#94a3b8);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            github.com/omertai224/${repoKey}
          </div>
        </div>
        <button onclick="downloadRepo('${repoKey}', '${repoMeta.name}')" style="background:var(--orange-deep,#e8854a);color:white;border:none;padding:8px 18px;border-radius:20px;font-family:inherit;font-weight:700;font-size:0.82rem;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:opacity 0.2s;">הורד ZIP</button>
      </div>
    `;
  }).join('');
}

async function downloadRepo(repoKey, repoName) {
  const url = `https://github.com/omertai224/${repoKey}/archive/refs/heads/main.zip`;
  const a = document.createElement('a');
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setStatus('download', 'ok', repoName + ' — הורדה החלה');
}

async function downloadAllRepos() {
  setStatus('download', 'loading', 'מוריד את כל הריפוזיטוריז...');
  const entries = Object.entries(REPOS);
  for (const [repoKey, repoMeta] of entries) {
    await downloadRepo(repoKey, repoMeta.name);
    await new Promise(r => setTimeout(r, 800));
  }
  setStatus('download', 'ok', entries.length + ' ריפוזיטוריז הורדו');
}

// ===== IMAGE PICKER =====
const IMAGE_KEYS = ['hero', 'about', 'lecture', 'remote'];
const IMAGE_LABELS = { hero: 'הירו', about: 'מי אני', lecture: 'ההרצאה', remote: 'תמיכה מרחוק' };
let currentPickerKey = null;

function initImagePickers(contentData) {
  IMAGE_KEYS.forEach(key => {
    const container = document.getElementById(`img-picker-${key}`);
    if (!container) return;
    const url = (contentData.images && contentData.images[key]) || '';
    renderImagePicker(container, key, url);
  });
}

function renderImagePicker(container, key, url) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      ${url ? `<img src="${url}" style="width:80px;height:60px;object-fit:cover;border-radius:8px;border:2px solid var(--orange-deep);" id="img-preview-${key}">` 
             : `<div style="width:80px;height:60px;border-radius:8px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:1.4rem;" id="img-preview-${key}">🖼️</div>`}
      <button onclick="openGalleryPicker('${key}')" style="background:var(--orange-light);color:var(--orange-deep);border:none;padding:7px 14px;border-radius:50px;font-family:inherit;font-size:0.78rem;font-weight:700;cursor:pointer;">📁 בחר מגלריה</button>
      <label style="background:var(--orange-deep);color:#fff;border:none;padding:7px 14px;border-radius:50px;font-family:inherit;font-size:0.78rem;font-weight:700;cursor:pointer;">
        ⬆️ העלה תמונה
        <input type="file" accept="image/*,video/*" style="display:none;" onchange="uploadPickerImage(this,'${key}')">
      </label>
      ${url ? `<button onclick="clearPickerImage('${key}')" style="background:transparent;color:var(--muted);border:1px solid var(--border);padding:5px 10px;border-radius:50px;font-family:inherit;font-size:0.72rem;cursor:pointer;">✕ הסר</button>` : ''}
    </div>
    <input type="hidden" id="img-value-${key}" value="${url}">
  `;
}

function openGalleryPicker(key) {
  currentPickerKey = key;
  // פותח modal קטן עם הגלריה
  let modal = document.getElementById('gallery-picker-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'gallery-picker-modal';
    modal.style = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;width:100%;max-width:700px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:16px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:1rem;">בחר תמונה מהגלריה</strong>
          <button onclick="closeGalleryPicker()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;">✕</button>
        </div>
        <div id="gallery-picker-grid" style="padding:16px;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';

  const grid = document.getElementById('gallery-picker-grid');
  if (!galleryItems.length) {
    grid.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">אין תמונות בגלריה עדיין</p>';
    return;
  }
  grid.innerHTML = galleryItems.map((item, i) => `
    <div onclick="selectFromGalleryPicker('${item.url}')" style="cursor:pointer;border-radius:10px;overflow:hidden;aspect-ratio:1;border:2px solid transparent;transition:border 0.15s;" onmouseenter="this.style.borderColor='#f6a67e'" onmouseleave="this.style.borderColor='transparent'">
      ${item.type === 'video' 
        ? `<video src="${item.url}" style="width:100%;height:100%;object-fit:cover;" muted></video>`
        : `<img src="${item.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">`}
    </div>
  `).join('');
}

function closeGalleryPicker() {
  const modal = document.getElementById('gallery-picker-modal');
  if (modal) modal.style.display = 'none';
}

async function selectFromGalleryPicker(url) {
  closeGalleryPicker();
  await setPickerImage(currentPickerKey, url);
}

async function uploadPickerImage(input, key) {
  const file = input.files[0];
  if (!file) return;
  // וודא שהגלריה נטענה
  if (!galleryItems.length) await loadGalleryManager();
  const fileKey = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  try {
    const res = await fetch(`${WORKER_URL}/${fileKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
    const data = await res.json();
    if (data.url) {
      // שמירה גם בגלריה עם קטגוריה לפי ריפו
      const repoCategories = {
        'omer-taicher-site': 'דף ראשי',
        'omer-taicher-blog': 'בלוג',
        'omer-taicher-interactive': 'אינטראקטיבי'
      };
      const category = repoCategories[GITHUB_REPO] || 'כללי';
      const resourceType = file.type.startsWith('video') ? 'video' : 'image';
      galleryItems.unshift({ url: data.url, type: resourceType, name: file.name, category, date: new Date().toISOString() });
      await autoSaveGallery();
      await setPickerImage(key, data.url);
    }
  } catch(e) {
    console.error('שגיאה בהעלאה', e);
  }
}

async function clearPickerImage(key) {
  await setPickerImage(key, '');
}

async function setPickerImage(key, url) {
  const hiddenInput = document.getElementById(`img-value-${key}`);
  if (hiddenInput) hiddenInput.value = url;
  const container = document.getElementById(`img-picker-${key}`);
  if (container) renderImagePicker(container, key, url);
  // שמירה ל-content.json
  await saveImageToContent(key, url);
}

async function saveImageToContent(key, url) {
  try {
    const res = await ghGet('content.json');
    const currentContent = JSON.parse(decode(res.content));
    if (!currentContent.images) currentContent.images = {};
    currentContent.images[key] = url;
    const sha = res.sha;
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/content.json`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `עדכון תמונה: ${key}`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(currentContent, null, 2)))),
        sha
      })
    });
    setStatus('content', 'ok', `✓ תמונת ${IMAGE_LABELS[key]} עודכנה`);
  } catch(e) {
    console.error('שגיאה בשמירת תמונה', e);
    setStatus('content', 'error', 'שגיאה בשמירת תמונה');
  }
}


// ============================================================
// INTERACTIVE SUB-TABS
// ============================================================
function switchInteractiveTab(tab) {
  const contentPanel  = document.getElementById('ic-panel-content');
  const productsPanel = document.getElementById('ic-panel-products');
  const btnContent    = document.getElementById('ic-tab-btn-content');
  const btnProducts   = document.getElementById('ic-tab-btn-products');
  const saveBtn       = document.getElementById('save-interactive-content-btn');

  const isContent = tab === 'content';
  if (contentPanel)  contentPanel.style.display  = isContent ? 'block' : 'none';
  if (productsPanel) productsPanel.style.display  = isContent ? 'none'  : 'block';

  const activeStyle   = 'display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;border:none;padding:9px 20px;border-radius:50px;font-family:inherit;font-size:0.82rem;font-weight:700;cursor:pointer;';
  const inactiveStyle = 'display:inline-flex;align-items:center;gap:6px;background:transparent;color:var(--navy);border:1.5px solid var(--border);padding:9px 20px;border-radius:50px;font-family:inherit;font-size:0.82rem;font-weight:700;cursor:pointer;';
  if (btnContent)  btnContent.style.cssText  = isContent ? activeStyle : inactiveStyle;
  if (btnProducts) btnProducts.style.cssText = isContent ? inactiveStyle : activeStyle;
  if (saveBtn) saveBtn.style.display = isContent ? 'block' : 'none';
}


// ============================================================
// CONTACTS — Supabase
// ============================================================
const SB_URL = 'https://cbnwxmsgzffvssssqwdz.supabase.co';
function getSBKey() { return localStorage.getItem('sb_key') || ''; }

let allContacts = [];
let filteredContacts = [];
let contactSortDir = null;

async function sbFetch(method, path, body) {
  const key = getSBKey();
  if (!key) throw new Error('מפתח Supabase חסר');
  const opts = {
    method,
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : ''
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SB_URL + path, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadContacts() {
  const bar   = document.getElementById('contacts-stats-bar');
  const tbody = document.getElementById('contacts-tbody');
  if (bar)   bar.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-light);font-size:0.85rem;">טוען...</div>';
  if (tbody) tbody.innerHTML = '';

  // אם אין מפתח — בקש מהמשתמש
  if (!getSBKey()) {
    const k = prompt('הכנס Supabase Secret Key:');
    if (k) localStorage.setItem('sb_key', k.trim());
    else return;
  }

  try {
    const data = await sbFetch('GET', '/rest/v1/contacts?select=*&order=count.desc&limit=2000');
    allContacts = (data || []).map(c => ({
      first_name: c.first_name || '',
      last_name:  c.last_name  || '',
      email:      c.email      || '',
      phone:      c.phone      || '',
      count:      parseInt(c.count)  || 1,
      notes:      c.notes      || ''
    }));
    filteredContacts = [...allContacts];
    renderContactStats();
    renderContacts();
  } catch(e) {
    if (bar) bar.innerHTML = `<div style="grid-column:1/-1;padding:20px;color:#c0392b;font-size:0.85rem;text-align:center;">שגיאה בטעינה: ${e.message}</div>`;
    allContacts = [];
    filteredContacts = [];
    renderContacts();
  }
}

function renderContactStats() {
  const bar = document.getElementById('contacts-stats-bar');
  if (!bar) return;
  const total   = allContacts.length;
  const loyal3  = allContacts.filter(c => (parseInt(c.count)||1) >= 3).length;
  const loyal10 = allContacts.filter(c => (parseInt(c.count)||1) >= 10).length;
  const single  = allContacts.filter(c => (parseInt(c.count)||1) === 1).length;
  const items = [
    { label: 'סה"כ אנשי קשר',      value: total,   color: '#1a4a6b', bg: '#eef4f8' },
    { label: 'נאמנים (3+ הרצאות)', value: loyal3,  color: '#2d6a4f', bg: '#d8f3dc' },
    { label: 'מאוד נאמנים (10+)',  value: loyal10, color: '#e8854a', bg: '#fdeede' },
    { label: 'רישום יחיד',          value: single,  color: '#888',    bg: '#f5f5f5' },
  ];
  bar.innerHTML = items.map(i =>
    `<div style="background:${i.bg};border:1px solid var(--border);border-radius:10px;padding:14px 16px;text-align:center;">
      <div style="font-size:1.6rem;font-weight:900;color:${i.color};">${i.value}</div>
      <div style="font-size:0.73rem;color:var(--text-light);margin-top:4px;font-weight:600;">${i.label}</div>
    </div>`
  ).join('');
  const box = document.getElementById('contacts-insights');
  if (box) box.style.display = 'none';
}

function renderContacts() {
  const tbody = document.getElementById('contacts-tbody');
  const empty = document.getElementById('contacts-empty');
  const count = document.getElementById('contacts-count');
  if (!tbody) return;
  if (count) count.textContent = filteredContacts.length + ' תוצאות';
  if (!filteredContacts.length) {
    tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  tbody.innerHTML = filteredContacts.slice(0, 200).map((c, i) => {
    const cnt = parseInt(c.count) || 1;
    const col = cnt >= 10 ? '#e8854a' : cnt >= 3 ? '#2d6a4f' : '#aaa';
    const bg  = cnt >= 10 ? '#fdeede' : cnt >= 3 ? '#d8f3dc' : '#f5f5f5';
    const phone = (c.phone || '').replace(/^\+?972-?/, '0');
    const esc = s => (s||'').replace(/"/g, '&quot;');
    return `<tr style="border-bottom:1px solid var(--border);${i%2?'background:#fafafa;':''}">
      <td style="padding:9px 14px;font-weight:600;">${c.first_name}</td>
      <td style="padding:9px 14px;">${c.last_name}</td>
      <td style="padding:9px 14px;direction:ltr;text-align:right;font-size:0.8rem;color:#555;">${c.email}</td>
      <td style="padding:9px 14px;direction:ltr;text-align:right;font-size:0.8rem;color:#555;white-space:nowrap;">${phone}</td>
      <td style="padding:9px 14px;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
          <button onclick="changeCount('${esc(c.email)}',-1)" style="background:var(--cream);border:1px solid var(--border);width:22px;height:22px;border-radius:50%;font-size:0.9rem;cursor:pointer;color:var(--navy);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;padding:0;">-</button>
          <span style="background:${bg};color:${col};padding:3px 10px;border-radius:50px;font-size:0.75rem;font-weight:700;min-width:28px;text-align:center;">${cnt}</span>
          <button onclick="changeCount('${esc(c.email)}',1)" style="background:var(--cream);border:1px solid var(--border);width:22px;height:22px;border-radius:50%;font-size:0.9rem;cursor:pointer;color:var(--navy);font-family:inherit;display:inline-flex;align-items:center;justify-content:center;padding:0;">+</button>
        </div>
      </td>
      <td style="padding:9px 14px;font-size:0.78rem;color:#666;max-width:200px;">
        <div id="nd-${i}" onclick="editNote(${i})" style="cursor:pointer;min-height:20px;" title="לחץ לעריכה">${c.notes || '<span style="color:#ccc;">+ הוסף הערה</span>'}</div>
        <input id="ni-${i}" type="text" value="${esc(c.notes)}" onblur="saveNote(${i})" onkeydown="if(event.key==='Enter')saveNote(${i})" style="display:none;width:100%;padding:4px 8px;border:1.5px solid var(--navy);border-radius:6px;font-family:inherit;font-size:0.78rem;outline:none;">
      </td>
      <td style="padding:9px 14px;text-align:center;">
        <button onclick="deleteContact('${esc(c.email)}')" style="background:#fde8e8;color:#c0392b;border:none;padding:4px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;">מחק</button>
      </td>
    </tr>`;
  }).join('');
  if (filteredContacts.length > 200) {
    tbody.innerHTML += `<tr><td colspan="7" style="padding:14px;text-align:center;color:var(--text-light);font-size:0.82rem;">מוצגים 200 מתוך ${filteredContacts.length} — צמצמו את החיפוש</td></tr>`;
  }
}

function changeCount(email, delta) {
  const c = allContacts.find(x => x.email === email);
  if (!c) return;
  c.count = Math.max(1, (parseInt(c.count) || 1) + delta);
  const fc = filteredContacts.find(x => x.email === email);
  if (fc) fc.count = c.count;
  renderContactStats();
  renderContacts();
  saveContactToSB(email, { count: c.count });
}

function editNote(i) {
  document.getElementById('nd-' + i).style.display = 'none';
  const inp = document.getElementById('ni-' + i);
  inp.style.display = 'block';
  inp.focus();
}

function saveNote(i) {
  const inp  = document.getElementById('ni-' + i);
  const val  = inp.value.trim();
  const c    = filteredContacts[i];
  if (!c) return;
  const orig = allContacts.find(x => x.email === c.email);
  if (orig) orig.notes = val;
  c.notes = val;
  inp.style.display = 'none';
  const disp = document.getElementById('nd-' + i);
  disp.style.display = 'block';
  disp.innerHTML = val || '<span style="color:#ccc;">+ הוסף הערה</span>';
  saveContactToSB(c.email, { notes: val });
}

function toggleCountSort() {
  contactSortDir = contactSortDir === 'desc' ? 'asc' : 'desc';
  const arrow = document.getElementById('sort-arrow');
  if (arrow) arrow.textContent = contactSortDir === 'desc' ? '↓' : '↑';
  filterContacts();
}

function setLoyaltyFilter(val) {
  const sel = document.getElementById('contacts-filter-loyalty');
  if (sel) { sel.value = val; filterContacts(); }
}

function filterContacts() {
  const q  = (document.getElementById('contacts-search')?.value || '').toLowerCase();
  const lf = document.getElementById('contacts-filter-loyalty')?.value || 'all';
  filteredContacts = allContacts.filter(c => {
    const cnt = parseInt(c.count) || 1;
    const matchQ = !q
      || (c.first_name || '').toLowerCase().includes(q)
      || (c.last_name  || '').toLowerCase().includes(q)
      || (c.email      || '').toLowerCase().includes(q)
      || (c.phone      || '').includes(q);
    const matchL = lf === 'all' ? true
      : lf === '10'   ? cnt >= 10
      : lf === '3'    ? cnt >= 3
      : lf === '1'    ? cnt === 1
      : lf === 'notes'? !!(c.notes && c.notes.trim())
      : true;
    return matchQ && matchL;
  });
  if (contactSortDir) {
    filteredContacts.sort((a, b) =>
      contactSortDir === 'desc'
        ? (parseInt(b.count)||1) - (parseInt(a.count)||1)
        : (parseInt(a.count)||1) - (parseInt(b.count)||1)
    );
  }
  renderContacts();
  const count = document.getElementById('contacts-count');
  if (count) count.textContent = filteredContacts.length + ' תוצאות';
}

function deleteContact(email) {
  if (!confirm('למחוק את ' + email + '?')) return;
  allContacts      = allContacts.filter(c => c.email !== email);
  filteredContacts = filteredContacts.filter(c => c.email !== email);
  renderContactStats();
  renderContacts();
  deleteContactFromSB(email);
}

async function saveContactToSB(email, fields) {
  try {
    await sbFetch('PATCH', `/rest/v1/contacts?email=eq.${encodeURIComponent(email)}`, fields);
  } catch(e) {
    console.error('שגיאה בשמירה:', e);
  }
}

async function deleteContactFromSB(email) {
  try {
    await sbFetch('DELETE', `/rest/v1/contacts?email=eq.${encodeURIComponent(email)}`);
  } catch(e) {
    console.error('שגיאה במחיקה:', e);
  }
}

function exportContacts() {
  const rows = [['שם פרטי','שם משפחה','אימייל','טלפון','רישומים','הערות']];
  allContacts.forEach(c => rows.push([c.first_name, c.last_name, c.email, c.phone, parseInt(c.count)||1, c.notes||'']));
  const csv  = rows.map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'contacts.csv';
  a.click();
}

async function getFileSha(path) {
  const r = await fetch(
    `https://api.github.com/repos/omertai224/omer-taicher-site/contents/${path}`,
    { headers: { Authorization: 'token ' + GITHUB_TOKEN } }
  );
  if (!r.ok) return undefined;
  return (await r.json()).sha;
}

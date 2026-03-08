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

async function loadBlogManager() {
  setStatus('content', 'loading', 'טוען פוסטים...');
  const container = document.getElementById('blog-manager');
  if (!container) return;
  try {
    const data = await ghGet('posts.json');
    blogSha = data.sha;
    const parsed = JSON.parse(decode(data.content));
    blogPosts = (parsed.posts || []).sort((a, b) => new Date(b.date) - new Date(a.date));

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
    ? blogPosts.filter(p => (p.title || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q))
    : blogPosts;
  if (blogImageFilter === 'with') filtered = filtered.filter(p => p.image);
  if (blogImageFilter === 'without') filtered = filtered.filter(p => !p.image);
  const counter = document.getElementById('blog-search-count');
  if (counter) counter.textContent = filtered.length + ' פוסטים';
  items.innerHTML = filtered.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">לא נמצאו פוסטים</div>`
    : filtered.map(p => `
      <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
        ${p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="font-size:1.8rem;flex-shrink:0">${p.emoji || '📝'}</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${formatBlogDate(p.date)} · ${p.id}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
          <button onclick="window.open('https://omer-taicher-blog.vercel.app/post.html?id=${p.id}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>
          <button onclick="blogCopyById('${p.id}')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">העתק</button>
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
        </div>
      </div>`).join('');
}

function renderBlogList() {
  const container = document.getElementById('blog-manager');
  if (!container) return;

  const listHTML = blogPosts.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">אין פוסטים עדיין</div>`
    : blogPosts.map(p => `
      <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
        ${p.image ? `<img src="${p.image}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;">` : `<div style="font-size:1.8rem;flex-shrink:0">${p.emoji || '📝'}</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${formatBlogDate(p.date)} · ${p.id}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
          <button onclick="window.open('https://omer-taicher-blog.vercel.app/post.html?id=${p.id}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>
          <button onclick="blogCopyById('${p.id}')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">העתק</button>
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
        </div>
      </div>`).join('');

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
      <div style="display:flex;align-items:center;gap:8px;">
        <div id="blog-search-count" style="font-size:0.82rem;color:var(--text-light)">${blogPosts.length} פוסטים</div>
        <div style="display:flex;gap:3px;border:1px solid var(--border);border-radius:20px;overflow:hidden;padding:2px;">
          <button class="blog-img-filter" data-val="all" onclick="setBlogImageFilter('all')" style="background:var(--navy);color:#fff;border:none;padding:4px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;border-radius:16px;">הכל</button>
          <button class="blog-img-filter" data-val="with" onclick="setBlogImageFilter('with')" style="background:transparent;color:var(--text-mid);border:none;padding:4px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;border-radius:16px;">עם תמונה (${blogPosts.filter(p=>p.image).length})</button>
          <button class="blog-img-filter" data-val="without" onclick="setBlogImageFilter('without')" style="background:transparent;color:var(--text-mid);border:none;padding:4px 10px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;border-radius:16px;">בלי תמונה (${blogPosts.filter(p=>!p.image).length})</button>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit" onclick="blogCopyFormat()">העתק פורמט</button>
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

// העתק מתוך טופס עריכה
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

// העתק פורמט — הוראה מוכנה ל-ChatGPT
function blogCopyFormat() {
  const format = `אני רוצה שתארוז לי את הפוסט הבא בפורמט JSON מדויק.

חוקים לגוף הפוסט (שדה body):
- כל קבוצת שורות שצמודות = תג <p> אחד
- בין שורות בתוך אותה פסקה = <br>
- כותרת ביניים קצרה = <h2>
- אין אימוג'ים בשום מקום
- אין bullet points, אין מספרים — רק טקסט רץ

החזר בדיוק את המבנה הבא, JSON בלבד, בלי שום טקסט לפני או אחרי:

{
  "id": "מזהה-בעברית-עם-מקפים",
  "title": "כותרת הפוסט בלי אימוג'ים",
  "excerpt": "משפט או שניים שיופיעו בתצוגת הרשימה",
  "body": "<p>תוכן הפוסט...</p>",
  "date": "YYYY-MM-DD",
  "emoji": "",
  "image": "",
  "image_alt": "",
  "seo_title": "כותרת הפוסט | עומר טייכר",
  "seo_desc": "תיאור קצר עד 155 תווים"
}

הפוסט:
`;
  navigator.clipboard.writeText(format)
    .then(() => setStatus('content', 'ok', '✓ הפורמט הועתק — הדבק ב-ChatGPT ואחריו את הפוסט'))
    .catch(() => setStatus('content', 'error', 'שגיאה בהעתקה'));
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
          ${blogEditingId ? `<button onclick="blogCopyPost()" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">העתק הכל</button>` : ''}
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
      <div style="display:flex;gap:10px;align-items:flex-start;margin-top:4px">
        <div style="flex:1">
          <input id="bf-image" type="text" value="${post.image || ''}" placeholder="URL של תמונה" style="direction:ltr;text-align:left;margin-bottom:8px">
          <div id="bf-image-preview" style="margin-top:8px;${post.image ? '' : 'display:none'}">
            <img src="${post.image || ''}" style="max-width:100%;max-height:140px;border-radius:10px;border:1px solid var(--border);object-fit:cover">
            <button onclick="clearPostImage()" style="display:block;margin-top:6px;background:#fde8e8;color:#c0392b;border:none;padding:5px 14px;border-radius:20px;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit">✕ הסר תמונה</button>
          </div>
        </div>
        <div style="flex-shrink:0">
          <button onclick="triggerImageUpload()" id="bf-upload-btn" style="background:var(--navy);color:#fff;border:none;padding:10px 18px;border-radius:20px;font-size:0.8rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">העלאת תמונה</button>
          <input type="file" id="bf-image-file" accept="image/*,video/*" style="display:none" onchange="uploadToCloudinary(this)">
        </div>
      </div>
      <div id="bf-upload-status" style="font-size:0.75rem;color:var(--text-light);margin-top:6px"></div>
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
  if (blogEditingId) return blogEditingId;
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
  if (idField && !blogEditingId) idField.value = slug;
  const preview = document.getElementById('bf-slug-preview');
  if (preview) preview.textContent = slug ? 'post.html?id=' + slug : '';
}

function blogAutoSeo() {
  const title = document.getElementById('bf-title')?.innerHTML || '';
  const excerpt = document.getElementById('bf-excerpt')?.innerHTML || '';
  const seoTitle = document.getElementById('bf-seo-title');
  const seoDesc = document.getElementById('bf-seo-desc');
  if (seoTitle && !seoTitle.dataset.edited) seoTitle.value = title ? title + ' | עומר טייכר' : '';
  if (seoDesc && !seoDesc.dataset.edited) seoDesc.value = excerpt;
}

function titleToSlug(title) {
  return title.trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0590-\u05FF\uFB1D-\uFB4Fa-zA-Z0-9\-]/g, '')
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

async function blogSavePost() {
  const btn = document.getElementById('bf-save-btn') || document.getElementById('bf-save-btn-bottom');
  const alertEl = document.getElementById('bf-alert');
  const title   = document.getElementById('bf-title')?.innerHTML?.trim();
  const excerpt = document.getElementById('bf-excerpt')?.innerHTML?.trim();
  const body    = document.getElementById('bf-body')?.innerHTML.trim();
  const date    = document.getElementById('bf-date')?.value;
  const image   = document.getElementById('bf-image')?.value.trim() || '';
  const id      = blogEditingId || titleToSlug(title);
  const seoTitle = title + ' | עומר טייכר';
  const seoDesc  = excerpt;
  const imageAlt = title;

  if (!title)   { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">כותרת היא שדה חובה</div>'; return; }
  if (!excerpt) { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תקציר הוא שדה חובה</div>'; return; }
  if (!body)    { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">גוף הפוסט הוא שדה חובה</div>'; return; }
  if (!date)    { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תאריך הוא שדה חובה</div>'; return; }
  if (!id)      { alertEl.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">לא ניתן לייצר ID מהכותרת</div>'; return; }

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
    try {
      const data = await ghGet('gallery.json');
      gallerySha = data.sha;
      const saved = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
      categories = saved.categories || {};
    } catch(e) {
      gallerySha = null;
    }
    // קבצים מה-Worker בלבד
    const res = await fetch(WORKER_URL);
    if (res.ok) {
      const workerData = await res.json();
      const workerItems = workerData.items || [];
      galleryItems = workerItems.map(wi => {
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
    } else {
      galleryItems = [];
    }
    renderGallery();
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
        <button onclick="event.stopPropagation();copyGalleryUrl('${item.url}')" style="background:var(--orange-deep);color:#fff;border:none;width:100%;padding:6px;border-radius:6px;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">📋 העתק קישור</button>
        <button onclick="event.stopPropagation();deleteGalleryItem(${realIndex})" style="background:rgba(220,38,38,0.85);color:#fff;border:none;width:100%;padding:5px;border-radius:6px;font-family:inherit;font-size:0.68rem;font-weight:600;cursor:pointer;">🗑️ מחק</button>
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
    const categories = {};
    galleryItems.forEach(item => {
      if (item.key && item.category && item.category !== 'כללי') {
        categories[item.key] = item.category;
      }
    });
    const json = JSON.stringify({ categories }, null, 2);
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

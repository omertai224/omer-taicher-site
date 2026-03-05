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
    await autoBackup('content.json');
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
    renderBlogList();
    setStatus('content', 'ok', blogPosts.length + ' פוסטים נטענו');
  } catch(e) {
    setStatus('content', 'error', 'שגיאה בטעינת פוסטים: ' + e.message);
  }
}

function renderBlogList() {
  const container = document.getElementById('blog-manager');
  if (!container) return;

  const listHTML = blogPosts.length === 0
    ? `<div style="text-align:center;padding:40px;color:var(--text-light);font-size:0.88rem">אין פוסטים עדיין</div>`
    : blogPosts.map(p => `
      <div style="background:var(--cream);border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:1.8rem;flex-shrink:0">${p.emoji || '📝'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.92rem;font-weight:700;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
          <div style="font-size:0.72rem;color:var(--text-light);margin-top:3px">${formatBlogDate(p.date)} · ${p.id}</div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">✏️ ערוך</button>
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">🗑 מחק</button>
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div style="font-size:0.82rem;color:var(--text-light)">${blogPosts.length} פוסטים</div>
      <button onclick="blogNewPost()" style="background:var(--orange-deep);color:#fff;border:none;padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">+ פוסט חדש</button>
    </div>
    <div id="blog-list-items">${listHTML}</div>`;
}

function blogNewPost() {
  blogEditingId = null;
  showBlogForm({
    id: '', title: '', excerpt: '', body: '', date: todayISO(), emoji: '📝', image: '', seo_title: '', seo_desc: ''
  });
}

function blogEditPost(id) {
  const post = blogPosts.find(p => p.id === id);
  if (!post) return;
  blogEditingId = id;
  showBlogForm(post);
}

function showBlogForm(post) {
  const container = document.getElementById('blog-manager');
  container.innerHTML = `
    <div style="margin-bottom:18px;display:flex;align-items:center;gap:12px">
      <button onclick="loadBlogManager()" style="background:var(--cream);color:var(--navy);border:1px solid var(--border);padding:8px 16px;border-radius:20px;font-size:0.82rem;font-weight:700;cursor:pointer;font-family:inherit">→ חזרה לרשימה</button>
      <div style="font-size:0.95rem;font-weight:800;color:var(--navy)">${blogEditingId ? 'עריכת פוסט' : 'פוסט חדש'}</div>
    </div>

    <div class="field">
      <label class="field-label">כותרת *</label>
      <textarea id="bf-title" rows="2" oninput="blogAutoSlug();blogAutoSeo()">${post.title}</textarea>
    </div>
    <div style="font-size:0.72rem;color:var(--text-light);margin:-10px 0 14px;direction:ltr;text-align:left" id="bf-slug-preview">${post.id ? 'post.html?id=' + post.id : ''}</div>

    <div class="field">
      <label class="field-label">תקציר *</label>
      <textarea id="bf-excerpt" rows="3" oninput="blogAutoSeo()">${post.excerpt}</textarea>
    </div>

    <div class="field">
      <label class="field-label">גוף הפוסט * — ניתן להשתמש ב-HTML: &lt;p&gt; &lt;h2&gt; &lt;strong&gt; &lt;ul&gt; &lt;li&gt;</label>
      <textarea id="bf-body" rows="14" style="font-size:0.82rem">${post.body}</textarea>
    </div>

    <div class="fields-row">
      <div class="field">
        <label class="field-label">תאריך *</label>
        <input id="bf-date" type="date" value="${post.date}">
      </div>
      <div class="field">
        <label class="field-label">אמוג'י</label>
        <input id="bf-emoji" type="text" value="${post.emoji || '📝'}" maxlength="4">
      </div>
    </div>

    <div class="field">
      <label class="field-label">ID / Slug</label>
      <input id="bf-id" type="text" value="${post.id}" style="direction:ltr;text-align:left" placeholder="מייוצר אוטומטית מהכותרת">
    </div>

    <div class="fields-divider">SEO — ממולא אוטומטית, ניתן לשנות</div>
    <div class="field">
      <label class="field-label">כותרת SEO</label>
      <input id="bf-seo-title" type="text" value="${post.seo_title || ''}">
    </div>
    <div class="field">
      <label class="field-label">תיאור SEO</label>
      <textarea id="bf-seo-desc" rows="2">${post.seo_desc || ''}</textarea>
    </div>

    <div style="margin-top:24px;display:flex;gap:12px;align-items:center">
      <button onclick="blogSavePost()" id="bf-save-btn" style="background:var(--orange-deep);color:#fff;border:none;padding:12px 32px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit">${blogEditingId ? '💾 שמור שינויים' : '🚀 פרסם פוסט'}</button>
      <button onclick="loadBlogManager()" style="background:transparent;color:var(--text-mid);border:1px solid var(--border);padding:11px 24px;border-radius:50px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>
    <div id="bf-alert" style="margin-top:14px"></div>`;
}

function blogAutoSlug() {
  const title = document.getElementById('bf-title')?.value || '';
  const slug = titleToSlug(title);
  const idField = document.getElementById('bf-id');
  if (idField && !blogEditingId) idField.value = slug;
  const preview = document.getElementById('bf-slug-preview');
  if (preview) preview.textContent = slug ? 'post.html?id=' + slug : '';
}

function blogAutoSeo() {
  const title = document.getElementById('bf-title')?.value || '';
  const excerpt = document.getElementById('bf-excerpt')?.value || '';
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
  const btn = document.getElementById('bf-save-btn');
  const alert = document.getElementById('bf-alert');
  const title   = document.getElementById('bf-title')?.value.trim();
  const excerpt = document.getElementById('bf-excerpt')?.value.trim();
  const body    = document.getElementById('bf-body')?.value.trim();
  const date    = document.getElementById('bf-date')?.value;
  const emoji   = document.getElementById('bf-emoji')?.value.trim() || '📝';
  const image   = '';
  const id      = document.getElementById('bf-id')?.value.trim() || titleToSlug(title);
  const seoTitle= document.getElementById('bf-seo-title')?.value.trim() || title + ' | עומר טייכר';
  const seoDesc = document.getElementById('bf-seo-desc')?.value.trim() || excerpt;

  if (!title)   { alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">כותרת היא שדה חובה</div>'; return; }
  if (!excerpt) { alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תקציר הוא שדה חובה</div>'; return; }
  if (!body)    { alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">גוף הפוסט הוא שדה חובה</div>'; return; }
  if (!date)    { alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">תאריך הוא שדה חובה</div>'; return; }
  if (!id)      { alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">לא ניתן לייצר ID מהכותרת</div>'; return; }

  btn.disabled = true;
  btn.textContent = 'שומר...';
  setStatus('content', 'loading', 'מפרסם פוסט...');

  try {
    // טעינה מחדש לקבלת SHA עדכני
    const fresh = await ghGet('posts.json');
    blogSha = fresh.sha;
    const freshData = JSON.parse(decode(fresh.content));
    let posts = freshData.posts || [];

    const post = { id, title, excerpt, body, date, emoji, image, seo_title: seoTitle, seo_desc: seoDesc };

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
    alert.innerHTML = '<div style="color:#c0392b;font-size:0.85rem">שגיאה: ' + e.message + '</div>';
    setStatus('content', 'error', 'שגיאה: ' + e.message);
    btn.disabled = false;
    btn.textContent = blogEditingId ? '💾 שמור שינויים' : '🚀 פרסם פוסט';
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

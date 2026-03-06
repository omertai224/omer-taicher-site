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
          <button onclick="blogEditPost('${p.id}')" style="background:var(--navy-light);color:var(--navy);border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">ערוך</button>
          <button onclick="window.open('https://omer-taicher-blog.vercel.app/post.html?id=${p.id}','_blank')" style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">צפה</button>
          <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">העתק</button>
          <button onclick="blogDeletePost('${p.id}')" style="background:#fde8e8;color:#c0392b;border:none;padding:7px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit">מחק</button>
        </div>
      </div>`).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
      <div style="font-size:0.82rem;color:var(--text-light)">${blogPosts.length} פוסטים</div>
      <div style="display:flex;gap:8px">
        <button style="background:var(--cream);color:var(--text-mid);border:1px solid var(--border);padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">העתק הכל</button>
        <button onclick="blogPasteFromClipboard()" style="background:var(--navy-light);color:var(--navy);border:none;padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">הדבק פוסט</button>
        <button onclick="blogNewPost()" style="background:var(--orange-deep);color:#fff;border:none;padding:9px 20px;border-radius:50px;font-size:0.85rem;font-weight:700;cursor:pointer;font-family:inherit">+ פוסט חדש</button>
      </div>
    </div>
    <div id="blog-list-items">${listHTML}</div>`;
}

function blogNewPost() {
  blogEditingId = null;
  showBlogForm({
    id: '', title: '', excerpt: '', body: '', date: todayISO(), emoji: '📝', image: '', image_alt: '', seo_title: '', seo_desc: ''
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
      >${post.body}</div>
      <style>#bf-body,#bf-body *{font-size:0.88rem!important;line-height:1.75!important;font-family:inherit!important}</style>
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

    <div class="field">
      <label class="field-label">תיאור תמונה (Alt) — חשוב להנגשה ו-SEO</label>
      <input id="bf-image-alt" type="text" value="${post.image_alt || ''}" placeholder="תאר את התמונה במשפט קצר">
    </div>

    <div class="field">
      <label class="field-label">תאריך *</label>
      <input id="bf-date" type="date" value="${post.date}">
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
      <button onclick="blogSavePost()" id="bf-save-btn" style="background:var(--orange-deep);color:#fff;border:none;padding:12px 32px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit">${blogEditingId ? 'שמור שינויים' : 'פרסם'}</button>
      <button onclick="loadBlogManager()" style="background:transparent;color:var(--text-mid);border:1px solid var(--border);padding:11px 24px;border-radius:50px;font-size:0.88rem;font-weight:600;cursor:pointer;font-family:inherit">ביטול</button>
    </div>
    <div id="bf-alert" style="margin-top:14px"></div>`;
}

// ===== CLOUDINARY =====
const CLOUDINARY_CLOUD = 'drxyfq0cq';
const CLOUDINARY_PRESET = 'omer_site';

function triggerImageUpload() {
  document.getElementById('bf-image-file').click();
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
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    const resourceType = file.type.startsWith('video') ? 'video' : 'image';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
      method: 'POST', body: fd
    });
    const data = await res.json();
    if (data.secure_url) {
      document.getElementById('bf-image').value = data.secure_url;
      const preview = document.getElementById('bf-image-preview');
      preview.style.display = 'block';
      preview.querySelector('img').src = data.secure_url;
      status.style.color = 'var(--green)';
      status.textContent = '✓ הועלה בהצלחה';
    } else {
      throw new Error(data.error?.message || 'שגיאה לא ידועה');
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
  const body    = document.getElementById('bf-body')?.innerHTML.trim();
  const date    = document.getElementById('bf-date')?.value;
  const emoji   = '';
  const image   = document.getElementById('bf-image')?.value.trim() || '';
  const imageAlt= document.getElementById('bf-image-alt')?.value.trim() || '';
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

    const post = { id, title, excerpt, body, date, emoji, image, image_alt: imageAlt, seo_title: seoTitle, seo_desc: seoDesc };

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
    // מנסה לפרסר כ-JSON תחילה
    const parsed = JSON.parse(text.trim());
    post = {
      id:        parsed.id        || '',
      title:     parsed.title     || '',
      excerpt:   parsed.excerpt   || '',
      body:      parsed.body      || '',
      date:      parsed.date      || todayISO(),
      emoji:     parsed.emoji     || '📝',
      image:     parsed.image     || '',
      image_alt: parsed.image_alt || '',
      seo_title: parsed.seo_title || (parsed.title ? parsed.title + ' | עומר טייכר' : ''),
      seo_desc:  parsed.seo_desc  || parsed.excerpt || ''
    };
  } catch(e) {
    // אם לא JSON — מפרסר כטקסט גולמי
    post = parseWixPost(text);
  }

  blogEditingId = null;
  showBlogForm(post);
  setTimeout(updateBodyPreview, 50);

function updateBodyPreview() {
  const preview = document.getElementById('bf-body-preview');
  if (preview) preview.innerHTML = document.getElementById('bf-body').value;
}


  // מנקה ומחלק לשורות
  const lines = raw.split('\n').map(l => l.trim());

  // מזהה אמוג'י בשורה הראשונה או השנייה
  const emojiMatch = (lines[0] + ' ' + (lines[1] || '')).match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  const emoji = emojiMatch ? emojiMatch[0] : '📝';

  // כותרת = שורה ראשונה, בלי האמוג'י
  const title = lines[0].replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

  // אוסף שורות לפסקאות — שורות ריקות מפרידות בין פסקאות
  const paragraphs = [];
  let current = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line === '') {
      if (current.length > 0) {
        paragraphs.push(current.join(' '));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));

  // ממיר לHTML
  const bodyParts = paragraphs.map(p => {
    // פסקאות קצרות שנראות כמו כותרות (עד 6 מילים, ללא נקודה בסוף)
    const wordCount = p.split(' ').length;
    if (wordCount <= 6 && !p.endsWith('.') && !p.endsWith(',') && p.length < 60) {
      return `<h2>${p}</h2>`;
    }
    return `<p>${p}</p>`;
  });

  const body = bodyParts.join('\n');

  // תקציר = שתי הפסקאות הראשונות מחוברות
  const excerptParts = paragraphs.slice(0, 2).join(' ').replace(/<[^>]+>/g, '');
  const excerpt = excerptParts.length > 160 ? excerptParts.slice(0, 157) + '...' : excerptParts;

  return {
    id: '',
    title,
    excerpt,
    body,
    date: todayISO(),
    emoji,
    image: '',
    image_alt: '',
    seo_title: title + ' | עומר טייכר',
    seo_desc: excerpt
  };
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
    const data = await ghGet('gallery.json');
    gallerySha = data.sha;
    const content = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
    galleryItems = content.items || [];
    renderGallery();
    setStatus('gallery', 'ok', galleryItems.length + ' פריטים');
  } catch(e) {
    gallerySha = null;
    galleryItems = [];
    renderGallery();
    setStatus('gallery', 'ok', 'גלריה ריקה');
  }
}

function filterGallery(cat) {
  galleryFilter = cat;
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.classList.toggle('gallery-filter-active', btn.dataset.cat === cat);
  });
  renderGallery();
}

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
    return;
  }

  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';

  grid.innerHTML = filtered.map((item) => {
    const realIndex = galleryItems.indexOf(item);
    return `
    <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:#f5f5f5;aspect-ratio:1;" id="gitem-${realIndex}">
      ${item.type === 'video'
        ? `<video src="${item.url}" style="width:100%;height:100%;object-fit:cover;" muted preload="metadata"></video>
           <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);color:#fff;font-size:0.6rem;padding:2px 6px;border-radius:6px;font-weight:700;">וידאו</div>`
        : `<img src="${item.url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="${item.name}">`
      }
      <div style="position:absolute;top:6px;left:6px;background:var(--orange-deep);color:#fff;font-size:0.58rem;padding:2px 7px;border-radius:50px;font-weight:700;">${item.category || ''}</div>
      <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;flex-direction:column;justify-content:flex-end;padding:8px;gap:4px;opacity:0;transition:all 0.2s;"
           onmouseenter="this.style.background='rgba(0,0,0,0.55)';this.style.opacity='1'"
           onmouseleave="this.style.background='rgba(0,0,0,0)';this.style.opacity='0'">
        <button onclick="copyGalleryUrl('${item.url}')" style="background:var(--orange-deep);color:#fff;border:none;width:100%;padding:6px;border-radius:6px;font-family:inherit;font-size:0.72rem;font-weight:700;cursor:pointer;">📋 העתק קישור</button>
        <button onclick="deleteGalleryItem(${realIndex})" style="background:rgba(255,50,50,0.7);color:#fff;border:none;width:100%;padding:5px;border-radius:6px;font-family:inherit;font-size:0.68rem;font-weight:600;cursor:pointer;">🗑️ מחק</button>
      </div>
    </div>`;
  }).join('');
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
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', CLOUDINARY_PRESET);
      const resourceType = file.type.startsWith('video') ? 'video' : 'image';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`, {
        method: 'POST', body: fd
      });
      const data = await res.json();
      if (data.secure_url) {
        galleryItems.unshift({
          url: data.secure_url,
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
    const json = JSON.stringify({ items: galleryItems }, null, 2);
    const result = await ghPut('gallery.json', json, gallerySha, 'עדכון גלריה');
    if (result.content) {
      gallerySha = result.content.sha;
      setStatus('gallery', 'ok', '✓ נשמר — ' + galleryItems.length + ' פריטים');
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
  if (!confirm('למחוק את הקובץ מהרשימה?')) return;
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

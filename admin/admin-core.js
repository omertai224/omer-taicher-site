// ===== MODAL HELPERS =====
function showConfirm(text, onYes, opts = {}) {
  const modal = document.getElementById('app-modal');
  const icon = document.getElementById('app-modal-icon');
  const textEl = document.getElementById('app-modal-text');
  const subEl = document.getElementById('app-modal-sub');
  const btns = document.getElementById('app-modal-buttons');
  icon.innerHTML = opts.icon || '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  textEl.textContent = text;
  subEl.textContent = opts.sub || '';
  subEl.style.display = opts.sub ? 'block' : 'none';
  const yesText = opts.yes || 'כן';
  const noText = opts.no || 'ביטול';
  const yesColor = opts.color || '#ef4444';
  btns.innerHTML = `<button id="modal-yes" style="background:${yesColor};color:#fff;border:none;padding:12px 28px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;">${yesText}</button><button id="modal-no" style="background:#eef4f8;color:#1a4a6b;border:none;padding:12px 28px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;">${noText}</button>`;
  modal.style.display = 'flex';
  document.getElementById('modal-yes').onclick = () => { modal.style.display = 'none'; onYes(); };
  document.getElementById('modal-no').onclick = () => { modal.style.display = 'none'; if (opts.onNo) opts.onNo(); };
}

function showAlert(text, opts = {}) {
  const modal = document.getElementById('app-modal');
  const icon = document.getElementById('app-modal-icon');
  const textEl = document.getElementById('app-modal-text');
  const subEl = document.getElementById('app-modal-sub');
  const btns = document.getElementById('app-modal-buttons');
  const isError = opts.type === 'error';
  const isSuccess = opts.type === 'success';
  icon.innerHTML = opts.icon || (isError ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' : isSuccess ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27ae60" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a4a6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>');
  textEl.textContent = text;
  subEl.textContent = opts.sub || '';
  subEl.style.display = opts.sub ? 'block' : 'none';
  btns.innerHTML = `<button id="modal-ok" style="background:${isError ? '#ef4444' : isSuccess ? '#27ae60' : '#1a4a6b'};color:#fff;border:none;padding:12px 32px;border-radius:50px;font-size:0.9rem;font-weight:700;cursor:pointer;font-family:inherit;">${opts.ok || 'הבנתי'}</button>`;
  modal.style.display = 'flex';
  document.getElementById('modal-ok').onclick = () => { modal.style.display = 'none'; if (opts.onClose) opts.onClose(); };
}

// ===== GLOBALS =====
const GITHUB_USER = 'omertai224';
const _isGitHubPages = location.hostname.endsWith('.github.io');
const _explicitBranch = new URLSearchParams(location.search).get('branch');
let GITHUB_BRANCH = _explicitBranch || (_isGitHubPages ? (localStorage.getItem('admin_branch') || 'main') : 'main');
const WORKER_URL = 'https://media-worker.omertai224.workers.dev';
const REPOS = {
  'omer-taicher-site':      { name: 'דף ראשי' },
  'omer-taicher-interactive': { name: 'אינטראקטיבי' },
  'omer-taicher-blog':      { name: 'בלוג' }
};
let GITHUB_REPO = 'omer-taicher-site';
let GITHUB_TOKEN = '';
let contentSha = null;
let currentData = null;
let currentCodeFile = null;
let currentCodeSha = null;
let currentTreePath = '';

// ===== TOKEN =====
function checkToken() {
  GITHUB_TOKEN = localStorage.getItem('gh_token') || '';
  if (!GITHUB_TOKEN) {
    document.getElementById('token-gate').style.display = 'flex';
  } else {
    document.getElementById('token-gate').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    init();
  }
}

function saveToken() {
  const username = document.getElementById('token-input').value.trim();
  if (!username) { showLoginError('נא להכניס טוקן'); return; }
  if (!/^(ghp_|github_pat_)/.test(username) || username.length < 20) {
    showLoginError('הטוקן לא נראה תקין — בדוק שהעתקת נכון');
    return;
  }
  const btn = document.querySelector('.token-btn');
  btn.textContent = 'מתחבר...';
  btn.disabled = true;

  fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${username}` }
  })
  .then(r => {
    if (!r.ok) throw new Error('github');
    localStorage.setItem('gh_token', username);
    GITHUB_TOKEN = username;
    document.getElementById('token-gate').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    init();
  })
  .catch(() => {
    btn.textContent = 'כניסה';
    btn.disabled = false;
    showLoginError('טוקן שגוי או שאין חיבור לאינטרנט');
  });
}

function showLoginError(msg) {
  let el = document.getElementById('login-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'login-error';
    el.style = 'color:#f6a67e;font-size:0.82rem;font-weight:700;margin-top:10px;text-align:center;';
    document.querySelector('.token-btn').after(el);
  }
  el.textContent = msg;
}

// ===== BRANCH AUTO-DETECT =====
function initBranchSelector() {
  updateBranchBadge();
  if (!_isGitHubPages || _explicitBranch) return;
  fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/branches?per_page=50`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  })
  .then(r => r.ok ? r.json() : [])
  .then(branches => {
    const claudeBranches = branches.filter(b => b.name.startsWith('claude/'));
    if (claudeBranches.length > 0) {
      const latest = claudeBranches.sort((a, b) => b.name.localeCompare(a.name))[0];
      if (latest.name !== GITHUB_BRANCH) {
        GITHUB_BRANCH = latest.name;
        localStorage.setItem('admin_branch', latest.name);
        updateBranchBadge();
        contentSha = null; currentData = null;
        init();
      }
    }
  });
}

function updateBranchBadge() {
  const bar = document.getElementById('env-bar');
  if (!bar) return;
  const isMain = GITHUB_BRANCH === 'main';
  bar.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 16px;font-family:inherit;font-size:0.78rem;font-weight:700;letter-spacing:0.02em;direction:ltr;' +
    (isMain
      ? 'background:#e6f4ea;color:#1e7e34;border-bottom:2px solid #1e7e34;'
      : 'background:#fff3e0;color:#c46a2a;border-bottom:2px solid #e8854a;');
  bar.innerHTML = isMain
    ? '<span style="width:8px;height:8px;border-radius:50%;background:#1e7e34;display:inline-block"></span> production · main'
    : '<span style="width:8px;height:8px;border-radius:50%;background:#e8854a;display:inline-block;animation:pulse 2s infinite"></span> preview · ' + GITHUB_BRANCH;
}

// ===== INIT =====
function init() {
  initBranchSelector();
  let savedRepo = localStorage.getItem('admin_active_repo') || 'omer-taicher-blog';
  if (savedRepo === 'omer-taicher-site') savedRepo = 'omer-taicher-blog';
  const rawTab    = localStorage.getItem('admin_active_tab') || 'content';
  const validTabs = ['content', 'code', 'gallery', 'download', 'contacts'];
  const savedTab  = validTabs.includes(rawTab) ? rawTab : 'content';
  const btnMap = {
    'omer-taicher-interactive': 'repo-btn-tutorials',
    'omer-taicher-blog':      'repo-btn-blog'
  };
  selectRepo(savedRepo, document.getElementById(btnMap[savedRepo]));
  if (savedTab !== 'content') switchTab(savedTab);
  updateGlobalPushUI();
}

// ===== TABS =====
function switchTab(name, btn) {
  const utilityTabs = ['code', 'gallery', 'download', 'contacts'];
  const isUtility = utilityTabs.includes(name);

  // הסתר את כל הפאנלים
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  if (isUtility) {
    // הצג פאנל כלי עזר
    document.getElementById('tab-' + name).classList.add('active');
  } else {
    // הצג תוכן — חזרה לתוכן הריפו הנוכחי
    document.getElementById('tab-content').classList.add('active');
  }

  // הדגשת כפתורי עזר
  const utilBtns = { download: 'tab-btn-download', gallery: 'tab-btn-gallery', contacts: 'tab-btn-contacts', code: 'tab-btn-code' };
  for (const [key, id] of Object.entries(utilBtns)) {
    const b = document.getElementById(id);
    if (b) {
      b.style.opacity = name === key ? '1' : '0.65';
      b.style.transform = name === key ? 'scale(1.05)' : 'scale(1)';
    }
  }

  // כפתור שמור ופרסם
  const saveBtn = document.getElementById('save-content-btn');
  if (saveBtn) saveBtn.style.visibility = (!isUtility && GITHUB_REPO === 'omer-taicher-site') ? 'visible' : 'hidden';

  localStorage.setItem('admin_active_tab', name);
  if (name === 'download') initDownloadTab();
  if (name === 'gallery') loadGalleryManager();
  if (name === 'contacts') loadContacts();
  if (name === 'code') {
    // טען עץ קבצים לריפו הנוכחי
    if (GITHUB_REPO === 'omer-taicher-site') loadFileTree('admin');
    else loadFileTree('');
    // סמן כפתור repo נכון בטאב קוד
    document.querySelectorAll('.code-repo-btn').forEach(b => b.classList.remove('active'));
    const codeRepoBtnMap = { 'omer-taicher-site': 'code-repo-site', 'omer-taicher-interactive': 'code-repo-interactive', 'omer-taicher-blog': 'code-repo-blog' };
    const activeCodeBtn = document.getElementById(codeRepoBtnMap[GITHUB_REPO]);
    if (activeCodeBtn) activeCodeBtn.classList.add('active');
  }
}

// ===== CODE REPO SWITCHER =====
function switchCodeRepo(repoName, btn) {
  GITHUB_REPO = repoName;
  currentCodeFile = null;
  currentCodeSha = null;
  currentTreePath = '';

  // סמן כפתור פעיל
  document.querySelectorAll('.code-repo-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // אפס עורך
  const codeEditor = document.getElementById('code-editor');
  if (codeEditor) codeEditor.value = '';
  const editorFilename = document.getElementById('editor-filename');
  if (editorFilename) editorFilename.textContent = '— בחר קובץ —';

  // טען עץ קבצים — כל הריפוזיטוריז מאוחדים תחת omer-taicher-site
  if (repoName === 'omer-taicher-site') loadFileTree('admin');
  else if (repoName === 'omer-taicher-blog') loadFileTree('');
  else if (repoName === 'omer-taicher-interactive') loadFileTree('');
}

// ===== REPO SWITCHER =====
function selectRepo(repoName, btn) {
  GITHUB_REPO = repoName;
  localStorage.setItem('admin_active_repo', repoName);
  contentSha = null; currentData = null;

  // כפתורי repo — active על הנבחר
  document.querySelectorAll('.repo-btn, .repo-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // חזרה לתצוגת תוכן
  switchTab('content');

  // הצג/הסתר תוכן לפי repo
  const isBlog  = repoName === 'omer-taicher-blog';
  const isTutos = repoName === 'omer-taicher-interactive';

  const blogMgr       = document.getElementById('blog-manager');
  const tutosContent  = document.getElementById('tutorials-content');
  if (blogMgr)      blogMgr.style.display       = isBlog  ? 'block' : 'none';
  if (tutosContent) tutosContent.style.display  = isTutos ? 'block' : 'none';

  // טען נתונים
  if (isBlog)  setTimeout(loadBlogManager, 50);
  if (isTutos) setTimeout(loadInteractiveManager, 50);
}

// ===== HELPERS =====
function setStatus(tab, type, msg) {
  const dot  = document.getElementById('status-dot-'  + tab);
  const text = document.getElementById('status-text-' + tab);
  if (dot)  dot.className   = 'status-dot ' + type;
  if (text) text.textContent = msg;
}

// All repos are now unified under omer-taicher-site
const UNIFIED_REPO = 'omer-taicher-site';
function resolveRepoPath(path) {
  if (GITHUB_REPO === 'omer-taicher-blog') return 'blog/' + path;
  if (GITHUB_REPO === 'omer-taicher-interactive') return 'interactive/' + path;
  return path;
}

async function ghGet(path) {
  const resolvedPath = resolveRepoPath(path);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/contents/${resolvedPath}?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const resolvedPath = resolveRepoPath(path);
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/contents/${resolvedPath}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), sha, branch: GITHUB_BRANCH })
  });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  return res.json();
}

// גישה ישירה ל-GitHub עם נתיב מלא (ללא resolveRepoPath)
async function ghGetDirect(fullPath) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/contents/${fullPath}?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  return res.json();
}

async function ghPutDirect(fullPath, content, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/contents/${fullPath}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), sha, branch: GITHUB_BRANCH })
  });
  if (!res.ok) throw new Error('GitHub API error: ' + res.status);
  return res.json();
}

async function ghDeleteDirect(fullPath, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${UNIFIED_REPO}/contents/${fullPath}`, {
    method: 'DELETE',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH })
  });
  if (!res.ok && res.status !== 404) throw new Error('GitHub API error: ' + res.status);
  return res.json();
}

function decode(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

// ===== GLOBAL PENDING CHANGES =====
const PENDING_KEY = 'admin_pending_changes';

function getPendingChanges() {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}'); } catch { return {}; }
}

function setPending(fileKey, data, commitMsg) {
  const pending = getPendingChanges();
  pending[fileKey] = { data, commitMsg, ts: Date.now() };
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  updateGlobalPushUI();
}

function clearPending(fileKey) {
  const pending = getPendingChanges();
  delete pending[fileKey];
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  updateGlobalPushUI();
}

function clearAllPending() {
  localStorage.removeItem(PENDING_KEY);
  updateGlobalPushUI();
}

function countPending() {
  return Object.keys(getPendingChanges()).length + (typeof blogDirty !== 'undefined' && blogDirty ? 1 : 0);
}

function updateGlobalPushUI() {
  const count = countPending();
  const bar = document.getElementById('global-push-bar');
  if (!bar) return;
  if (count === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'flex';
    const label = document.getElementById('global-push-label');
    if (label) label.textContent = count + ' קבצים ממתינים לדחיפה';
    const btn = document.getElementById('global-push-btn');
    if (btn) { btn.disabled = false; btn.textContent = 'דחוף הכל ל-GitHub'; }
  }
}

async function globalPushAll() {
  const btn = document.getElementById('global-push-btn');
  const label = document.getElementById('global-push-label');
  if (btn) { btn.disabled = true; btn.textContent = 'דוחף...'; }

  const pending = getPendingChanges();
  const keys = Object.keys(pending);
  const hasBlog = typeof blogDirty !== 'undefined' && blogDirty;
  const total = keys.length + (hasBlog ? 1 : 0);
  let done = 0;
  let errors = [];

  // Push blog files (posts-index.json + individual changed/deleted posts)
  if (hasBlog) {
    // 1. Push posts-index.json (lightweight, no body)
    try {
      if (label) label.textContent = 'דוחף posts-index.json...';
      const indexPath = 'blog/posts-index.json';
      const indexPosts = blogPosts.map(({ body, ...rest }) => rest);
      let indexSha;
      try {
        const freshIdx = await ghGetDirect(indexPath);
        indexSha = freshIdx.sha;
      } catch(e) { indexSha = undefined; } // קובץ חדש
      await ghPutDirect(indexPath, JSON.stringify({ posts: indexPosts }, null, 2), indexSha, 'עדכון אינדקס פוסטים');
    } catch(e) { errors.push('posts-index.json: ' + e.message); }

    // 3. Push individual post files that changed
    const dirtyIds = typeof blogDirtyIds !== 'undefined' ? [...blogDirtyIds] : [];
    for (const postId of dirtyIds) {
      const post = blogPosts.find(p => p.id === postId);
      if (!post) continue;
      try {
        if (label) label.textContent = 'דוחף posts/' + postId + '.json...';
        const postPath = 'blog/posts/' + postId + '.json';
        let postSha;
        try {
          const freshPost = await ghGetDirect(postPath);
          postSha = freshPost.sha;
        } catch(e) { postSha = undefined; } // קובץ חדש
        await ghPutDirect(postPath, JSON.stringify(post, null, 2), postSha, 'עדכון פוסט: ' + postId);
      } catch(e) { errors.push(postId + '.json: ' + e.message); }
    }

    // 4. Delete individual post files for deleted posts
    const deletedIds = typeof blogDeletedIds !== 'undefined' ? [...blogDeletedIds] : [];
    for (const postId of deletedIds) {
      try {
        if (label) label.textContent = 'מוחק posts/' + postId + '.json...';
        const postPath = 'blog/posts/' + postId + '.json';
        const freshPost = await ghGetDirect(postPath);
        await ghDeleteDirect(postPath, freshPost.sha, 'מחיקת פוסט: ' + postId);
      } catch(e) { /* ignore - file might not exist */ }
    }

    blogClearLocal();
  }

  // Push all other pending files (keys are already resolved paths)
  for (const fileKey of keys) {
    const entry = pending[fileKey];
    if (label) label.textContent = 'דוחף ' + fileKey + '... (' + (++done) + '/' + total + ')';
    try {
      const fresh = await ghGetDirect(fileKey);
      const sha = fresh.sha;
      const result = await ghPutDirect(fileKey, entry.data, sha, entry.commitMsg);
      if (result.content) {
        clearPending(fileKey);
      } else throw new Error(result.message || 'שגיאה');
    } catch(e) { errors.push(fileKey + ': ' + e.message); }
  }

  if (errors.length) {
    setStatus('content', 'error', 'שגיאות: ' + errors.join(', '));
    if (btn) { btn.disabled = false; btn.textContent = 'נסה שוב'; }
  } else {
    setStatus('content', 'ok', '✓ כל השינויים נדחפו! Vercel מפרסם...');
    updateGlobalPushUI();
  }
}

// ===== INTERACTIVE SUB-TABS =====
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

  if (saveBtn) {
    saveBtn.style.display = isContent ? 'block' : 'none';
  }
}

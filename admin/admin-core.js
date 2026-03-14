// ===== GLOBALS =====
const GITHUB_USER = 'omertai224';
const GITHUB_BRANCH = 'main';
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

// ===== INIT =====
function init() {
  let savedRepo = localStorage.getItem('admin_active_repo') || 'omer-taicher-interactive';
  if (savedRepo === 'omer-taicher-site') savedRepo = 'omer-taicher-interactive';
  const rawTab    = localStorage.getItem('admin_active_tab') || 'content';
  const validTabs = ['content', 'code', 'gallery', 'download', 'contacts'];
  const savedTab  = validTabs.includes(rawTab) ? rawTab : 'content';
  const btnMap = {
    'omer-taicher-interactive': 'repo-btn-tutorials',
    'omer-taicher-blog':      'repo-btn-blog'
  };
  selectRepo(savedRepo, document.getElementById(btnMap[savedRepo]));
  if (savedTab !== 'content') switchTab(savedTab);
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

function decode(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
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

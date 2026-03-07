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
  if (!username) { showLoginError('נא להכניס שם משתמש'); return; }
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
    showLoginError('שם משתמש שגוי');
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
  const savedRepo = localStorage.getItem('admin_active_repo') || 'omer-taicher-site';
  const savedTab  = localStorage.getItem('admin_active_tab')  || 'content';
  const btnMap = {
    'omer-taicher-site':      'repo-btn-site',
    'omer-taicher-interactive': 'repo-btn-tutorials',
    'omer-taicher-blog':      'repo-btn-blog'
  };
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabBtn  = [...tabBtns].find(b => b.getAttribute('onclick')?.includes("'" + savedTab + "'"));
  selectRepo(savedRepo, document.getElementById(btnMap[savedRepo]));
  switchTab(savedTab, tabBtn || null);
}

// ===== TABS =====
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');

  // כפתור גיבוי האתר — הדגש כשפעיל, אפס כשלא
  const dlBtn = document.getElementById('tab-btn-download');
  if (dlBtn) {
    dlBtn.style.opacity = name === 'download' ? '1' : '0.65';
    dlBtn.style.transform = name === 'download' ? 'scale(1.05)' : 'scale(1)';
  }

  // כפתור גלריה
  const glBtn = document.getElementById('tab-btn-gallery');
  if (glBtn) {
    glBtn.style.opacity = name === 'gallery' ? '1' : '0.65';
    glBtn.style.transform = name === 'gallery' ? 'scale(1.05)' : 'scale(1)';
  }

  const saveBtn = document.getElementById('save-content-btn');
  if (saveBtn) saveBtn.style.visibility = (name === 'content' && GITHUB_REPO === 'omer-taicher-site') ? 'visible' : 'hidden';
  localStorage.setItem('admin_active_tab', name);
  if (name === 'download') initDownloadTab();
  if (name === 'gallery') loadGalleryManager();
}

// ===== REPO SWITCHER =====
function selectRepo(repoName, btn) {
  GITHUB_REPO = repoName;
  localStorage.setItem('admin_active_repo', repoName);
  contentSha = null; currentData = null;
  currentCodeFile = null; currentCodeSha = null;
  currentTreePath = '';

  // כפתורי repo — active על הנבחר
  document.querySelectorAll('.repo-btn, .repo-pill').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // איפוס עורך קוד
  const codeEditor = document.getElementById('code-editor');
  if (codeEditor) codeEditor.value = '';
  const editorFilename = document.getElementById('editor-filename');
  if (editorFilename) editorFilename.textContent = '— בחר קובץ —';

  // הצג/הסתר תוכן לפי repo — רק בטאב תוכן
  const isSite  = repoName === 'omer-taicher-site';
  const isBlog  = repoName === 'omer-taicher-blog';
  const isTutos = repoName === 'omer-taicher-interactive';

  const siteBlocks    = document.getElementById('site-content-blocks');
  const blogMgr       = document.getElementById('blog-manager');
  const tutosContent  = document.getElementById('tutorials-content');
  if (siteBlocks)   siteBlocks.style.display   = isSite  ? 'block' : 'none';
  if (blogMgr)      blogMgr.style.display       = isBlog  ? 'block' : 'none';
  if (tutosContent) tutosContent.style.display  = isTutos ? 'block' : 'none';

  // כפתור שמור ופרסם — גלוי רק באתר ראשי + טאב תוכן
  const saveBtn = document.getElementById('save-content-btn');
  const activeTab = localStorage.getItem('admin_active_tab') || 'content';
  if (saveBtn) {
    saveBtn.style.visibility = (isSite && activeTab === 'content') ? 'visible' : 'hidden';
    saveBtn.disabled = true;
  }

  // status
  const statusDot  = document.getElementById('status-dot-content');
  const statusText = document.getElementById('status-text-content');
  if (statusDot)  statusDot.className  = 'status-dot loading';
  if (statusText) statusText.textContent = 'טוען...';

  // טען נתונים
  if (isSite)  loadContent();
  if (isBlog)  setTimeout(loadBlogManager, 50);
  if (isTutos) setTimeout(loadInteractiveManager, 50);
  loadFileTree(GITHUB_REPO === 'omer-taicher-site' ? 'admin' : '');
}

// ===== COPY FULL REPO =====
async function copyFullRepo() {
  const btn = document.getElementById('copy-tree-btn');
  if (btn) { btn.textContent = 'טוען...'; btn.disabled = true; }

  try {
    // קבלת עץ קבצים מלא
    const treeRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/HEAD?recursive=1`,
      { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    const treeData = await treeRes.json();

    // סינון רק קבצי טקסט רלוונטיים
    const files = (treeData.tree || []).filter(f =>
      f.type === 'blob' &&
      !f.path.startsWith('.') &&
      !f.path.includes('node_modules') &&
      /\.(html|js|css|json|md|txt)$/.test(f.path)
    );

    let output = `// ===== ${GITHUB_REPO} — ${new Date().toLocaleString('he-IL')} =====\n`;
    output += `// ${files.length} קבצים\n\n`;

    for (const file of files) {
      try {
        const res = await ghGet(file.path);
        const content = decode(res.content || '');
        output += `\n${'='.repeat(60)}\n// ${file.path}\n${'='.repeat(60)}\n`;
        output += content + '\n';
      } catch(e) {
        output += `\n// ${file.path} — שגיאה בטעינה\n`;
      }
    }

    await navigator.clipboard.writeText(output);
    if (btn) btn.textContent = '✓ הועתק!';
    setTimeout(() => { if (btn) { btn.textContent = 'העתק עץ'; btn.disabled = false; } }, 2500);
    // toast
    const toast = document.createElement('div');
    toast.textContent = `✓ הועתק! ${files.length} קבצים`;
    toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#1e5f74;color:#fff;padding:12px 28px;border-radius:50px;font-size:0.9rem;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);font-family:inherit;direction:rtl';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
    if (btn) { btn.textContent = 'העתק עץ'; btn.disabled = false; }
  }
}

// ===== HELPERS =====
function setStatus(tab, type, msg) {
  const dot  = document.getElementById('status-dot-'  + tab);
  const text = document.getElementById('status-text-' + tab);
  if (dot)  dot.className   = 'status-dot ' + type;
  if (text) text.textContent = msg;
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), sha, branch: GITHUB_BRANCH })
  });
  return res.json();
}

function decode(b64) {
  return decodeURIComponent(escape(atob(b64.replace(/\n/g, ''))));
}

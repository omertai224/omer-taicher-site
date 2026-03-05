// ===== GLOBALS =====
const GITHUB_USER = 'omertai224';
const GITHUB_BRANCH = 'main';
const REPOS = {
  'omer-taicher-site':      { name: '🌐 אתר ראשי' },
  'omer-taicher-tutorials': { name: '🎓 הדרכות' },
  'omer-taicher-blog':      { name: '✍️ בלוג' }
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
  const val = document.getElementById('token-input').value.trim();
  if (!val) return;
  localStorage.setItem('gh_token', val);
  GITHUB_TOKEN = val;
  document.getElementById('token-gate').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  init();
}

// ===== INIT =====
function init() {
  restoreTab();
  loadContent();
  loadFileTree('');
  loadBackups();
}

// ===== TABS =====
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
  document.getElementById('save-content-btn').style.display = name === 'content' ? 'flex' : 'none';
  localStorage.setItem('admin_active_tab', name);
}

function restoreTab() {
  const saved = localStorage.getItem('admin_active_tab') || 'content';
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + saved).classList.add('active');
  const names = ['content','code','backups'];
  const idx = names.indexOf(saved);
  const btns = document.querySelectorAll('.tab-btn');
  if (btns[idx]) btns[idx].classList.add('active');
  document.getElementById('save-content-btn').style.display = saved === 'content' ? 'flex' : 'none';
}

// ===== REPO SWITCHER =====
function toggleRepoDropdown() {
  document.getElementById('repo-dropdown').classList.toggle('open');
}

function selectRepo(repoName, label) {
  document.getElementById('repo-label').textContent = label;
  document.getElementById('repo-dropdown').classList.remove('open');
  document.querySelectorAll('.repo-option').forEach(o => o.classList.remove('active'));
  event.target.classList.add('active');
  switchRepo(repoName);
}

document.addEventListener('click', e => {
  const sw = document.getElementById('repo-switcher');
  if (sw && !sw.contains(e.target)) document.getElementById('repo-dropdown').classList.remove('open');
});

function switchRepo(repoName) {
  GITHUB_REPO = repoName;
  contentSha = null; currentData = null;
  currentCodeFile = null; currentCodeSha = null;
  currentTreePath = '';
  const codeEditor = document.getElementById('code-editor');
  if (codeEditor) codeEditor.value = '';
  const editorFilename = document.getElementById('editor-filename');
  if (editorFilename) editorFilename.textContent = '— בחר קובץ —';
  const deleteBtn = document.getElementById('delete-file-btn');
  if (deleteBtn) deleteBtn.style.display = 'none';
  const saveBtn = document.getElementById('save-content-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.style.display = 'none'; }
  const isMain = repoName === 'omer-taicher-site';
  const statusBar = document.getElementById('tab-content') && document.getElementById('tab-content').querySelector('.status-bar');
  if (statusBar) statusBar.style.display = isMain ? 'flex' : 'none';
  document.querySelectorAll('.section-block').forEach(b => b.style.display = isMain ? 'block' : 'none');
  // עבור אוטומטית לטאב קוד
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const tabCode = document.getElementById('tab-code');
  if (tabCode) tabCode.classList.add('active');
  const codeBtn = document.querySelector('.tab-btn[onclick*="code"]');
  if (codeBtn) codeBtn.classList.add('active');
  if (isMain) loadContent();
  loadFileTree('');
  loadBackups();
  setStatus('code', 'ok', 'עברת ל: ' + REPOS[repoName].name);
}

// ===== HELPERS =====
function setStatus(tab, type, msg) {
  const dot = document.getElementById('status-dot-' + tab);
  const text = document.getElementById('status-text-' + tab);
  if (dot) dot.className = 'status-dot ' + type;
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

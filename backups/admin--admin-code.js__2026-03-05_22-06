// ===== TAB: CODE EDITOR =====
const FILE_DESCRIPTIONS = {
  'index.html':'דף הבית', 'content.json':'תוכן האתר',
  'admin':'פאנל ניהול', 'admin-style.css':'עיצוב פאנל', 'admin-core.js':'לוגיקה ראשית',
  'admin-content.js':'טאב תוכן', 'admin-code.js':'טאב קוד', 'admin-backups.js':'טאב גיבויים',
  'assets':'קבצי אתר', 'js':'סקריפטים', 'toolbar.js':'סרגל נגישות',
  'images':'תמונות', 'backups':'גיבויים', 'Vibe':'קבצי עיצוב', '.gitkeep':'מחזיק תיקייה',
  'tutorials.json':'תוכן הדרכות'
};
const EXT_ICONS = { html:'🌐', js:'⚡', css:'🎨', json:'📋', md:'📝', txt:'📄', webp:'🖼', png:'🖼', jpg:'🖼', svg:'🎭' };

async function loadFileTree(path) {
  path = path || '';
  currentTreePath = path;
  setStatus('code', 'loading', 'טוען קבצים...');
  try {
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}&t=${Date.now()}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
    const items = await res.json();
    if (!Array.isArray(items)) throw new Error('לא ניתן לטעון');
    renderTree(items, path);
    setStatus('code', 'ok', 'בחר קובץ לעריכה');
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

function renderTree(items, currentPath) {
  const container = document.getElementById('file-items');
  items.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });
  // Breadcrumb
  let crumbs = `<span class="bc-part" onclick="loadFileTree('')">🏠 שורש</span>`;
  if (currentPath) {
    const parts = currentPath.split('/');
    parts.forEach((part, i) => {
      const partPath = parts.slice(0, i+1).join('/');
      crumbs += ` <span class="bc-sep">/</span> <span class="bc-part" onclick="loadFileTree('${partPath}')">${part}</span>`;
    });
  }
  let html = `<div class="breadcrumb">${crumbs}</div>`;
  items.forEach(item => {
    if (item.name === '.git') return;
    const ext = item.name.split('.').pop().toLowerCase();
    const icon = item.type === 'dir' ? '📁' : (EXT_ICONS[ext] || '📄');
    const desc = FILE_DESCRIPTIONS[item.name] || '';
    const descTag = desc ? `<span class="file-item-desc">${desc}</span>` : '';
    const delBtn = `<button class="delete-img-btn" onclick="confirmDelete('${item.path}','${item.sha || ''}','${item.type}')" title="מחק">🗑</button>`;
    if (item.type === 'dir') {
      html += `<div class="file-item"><span class="file-item-icon" onclick="loadFileTree('${item.path}')" style="cursor:pointer">${icon}</span><span class="file-item-name" onclick="loadFileTree('${item.path}')" style="cursor:pointer">${item.name}/</span>${descTag}${delBtn}</div>`;
    } else {
      const isEditable = ['html','js','css','json','md','txt','svg'].includes(ext);
      if (isEditable) {
        html += `<div class="file-item" id="fi-${item.path.replace(/\//g,'__')}"><span class="file-item-icon" onclick="loadFile('${item.path}')" style="cursor:pointer">${icon}</span><span class="file-item-name" onclick="loadFile('${item.path}')" style="cursor:pointer">${item.name}</span>${descTag}${delBtn}</div>`;
      } else {
        html += `<div class="file-item"><span class="file-item-icon">${icon}</span><span class="file-item-name">${item.name}</span>${descTag}${delBtn}</div>`;
      }
    }
  });
  container.innerHTML = html;
}

async function loadFile(filepath) {
  document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
  const itemEl = document.getElementById('fi-' + filepath.replace(/\//g,'__'));
  if (itemEl) itemEl.classList.add('active');
  const filename = filepath.split('/').pop();
  setStatus('code', 'loading', 'טוען ' + filename + '...');
  document.getElementById('editor-filename').textContent = filepath;
  document.getElementById('paste-publish-btn').disabled = true;
  document.getElementById('copy-editor-btn').disabled = true;
  
  try {
    const data = await ghGet(filepath);
    currentCodeFile = filepath;
    currentCodeSha = data.sha;
    let content = '';
    if (data.content) {
      content = decode(data.content);
    } else if (data.download_url) {
      const res = await fetch(data.download_url);
      content = await res.text();
    } else {
      throw new Error('לא ניתן לטעון קובץ זה');
    }
    document.getElementById('code-editor').value = content;
    setStatus('code', 'ok', filepath + ' — מוכן לעריכה');
    document.getElementById('paste-publish-btn').disabled = false;
    document.getElementById('copy-editor-btn').disabled = false;
    
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

async function pasteAndPublish() {
  if (!currentCodeFile) return;
  try {
    const text = await navigator.clipboard.readText();
    if (!text || !text.trim()) { setStatus('code', 'error', 'הלוח ריק — העתק קוד קודם'); return; }
    const currentContent = document.getElementById('code-editor').value;
    if (currentContent.trim()) {
      const filename = currentCodeFile.split('/').pop();
      const stamp = new Date().toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
      const blob = new Blob([currentContent], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename + '__backup_' + stamp + '.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    }
    document.getElementById('code-editor').value = text;
    await saveCode();
  } catch(e) {
    setStatus('code', 'error', 'לא ניתן לגשת ללוח — נסה להדביק ידנית');
  }
}

async function saveCode() {
  if (!currentCodeFile) return;
  const filename = currentCodeFile.split('/').pop();
  setStatus('code', 'loading', 'שומר ' + filename + '...');
  document.getElementById('paste-publish-btn').disabled = true;
  document.getElementById('copy-editor-btn').disabled = true;
  try {
    await autoBackup(currentCodeFile);
    const newContent = document.getElementById('code-editor').value;
    const result = await ghPut(currentCodeFile, newContent, currentCodeSha, 'עדכון ' + currentCodeFile + ' מפאנל הניהול');
    if (result.content) {
      currentCodeSha = result.content.sha;
      setStatus('code', 'ok', '✓ ' + filename + ' נשמר! Vercel מפרסם...');
    } else {
      setStatus('code', 'error', 'שגיאה: ' + (result.message || 'לא ידוע'));
    }
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
  document.getElementById('paste-publish-btn').disabled = false;
    document.getElementById('copy-editor-btn').disabled = false;
}

function newFilePrompt() {
  const name = prompt('שם הקובץ החדש:\n(נמצא כרגע ב: /' + (currentTreePath || 'שורש') + ')');
  if (!name || !name.trim()) return;
  const fullPath = currentTreePath ? currentTreePath + '/' + name.trim() : name.trim();
  createNewFile(fullPath);
}

function newFolderPrompt() {
  const name = prompt('שם התיקייה החדשה:\n(נמצא כרגע ב: /' + (currentTreePath || 'שורש') + ')');
  if (!name || !name.trim()) return;
  const base = currentTreePath ? currentTreePath + '/' + name.trim() : name.trim();
  createNewFile(base.replace(/\/$/, '') + '/.gitkeep', true);
}

async function createNewFile(filepath, isFolderInit) {
  setStatus('code', 'loading', 'יוצר...');
  const ext = filepath.split('.').pop().toLowerCase();
  const templates = {
    html: `<!DOCTYPE html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<title>דף חדש</title>\n</head>\n<body>\n\n</body>\n</html>`,
    js: `// ${filepath}\n`, css: `/* ${filepath} */\n`, json: `{}`, md: `# כותרת\n`
  };
  const content = isFolderInit ? '' : (templates[ext] || '');
  const message = isFolderInit ? 'יצירת תיקייה: ' + filepath.replace('/.gitkeep','') : 'יצירת קובץ: ' + filepath;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filepath}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), branch: GITHUB_BRANCH })
    });
    const result = await res.json();
    if (result.content) {
      if (isFolderInit) {
        const folderPath = filepath.replace('/.gitkeep','');
        setStatus('code', 'ok', '✓ תיקייה נוצרה: ' + folderPath);
        await loadFileTree(folderPath);
      } else {
        setStatus('code', 'ok', '✓ ' + filepath + ' נוצר!');
        await loadFileTree(currentTreePath || '');
        await loadFile(filepath);
      }
    } else {
      setStatus('code', 'error', 'שגיאה: ' + (result.message || 'לא ידוע'));
    }
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

async function deleteFile() {
  if (!currentCodeFile) return;
  const filename = currentCodeFile.split('/').pop();
  if (!confirm('למחוק את ' + filename + '?\nגיבוי אוטומטי ייצור לפני המחיקה.')) return;
  setStatus('code', 'loading', 'מוחק ' + filename + '...');
  try {
    await autoBackup(currentCodeFile);
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${currentCodeFile}`, {
      method: 'DELETE',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'מחיקת ' + currentCodeFile, sha: currentCodeSha, branch: GITHUB_BRANCH })
    });
    if (res.ok) {
      setStatus('code', 'ok', '✓ ' + filename + ' נמחק');
      document.getElementById('code-editor').value = '';
      document.getElementById('editor-filename').textContent = '— בחר קובץ —';
      
      currentCodeFile = null; currentCodeSha = null;
      loadFileTree('');
    } else {
      const err = await res.json();
      setStatus('code', 'error', 'שגיאה: ' + (err.message || 'לא ידוע'));
    }
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

// ===== CONFIRM MODAL =====
function confirmDelete(path, sha, type) {
  const name = path.split('/').pop();
  const modal = document.getElementById('confirm-modal');
  document.getElementById('confirm-modal-text').textContent = 'למחוק את ' + name + '?';
  modal.style.display = 'flex';
  document.getElementById('confirm-modal-yes').onclick = async () => {
    modal.style.display = 'none';
    if (type === 'dir') await deleteFolder(path);
    else await deleteAnyFile(path, sha);
  };
  document.getElementById('confirm-modal-no').onclick = () => { modal.style.display = 'none'; };
}

async function deleteAnyFile(path, sha) {
  const name = path.split('/').pop();
  setStatus('code', 'loading', 'מוחק ' + name + '...');
  // אם אין SHA — קבל אותו
  if (!sha) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
      });
      const d = await r.json();
      sha = d.sha;
    } catch(e) {}
  }
  const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'מחיקת ' + path, sha: sha, branch: GITHUB_BRANCH })
  });
  if (res.ok) {
    setStatus('code', 'ok', '✓ ' + name + ' נמחק');
    loadFileTree(currentTreePath || '');
  } else {
    const err = await res.json();
    setStatus('code', 'error', 'שגיאה: ' + (err.message || 'לא ידוע'));
  }
}

async function deleteFolder(folderPath) {
  setStatus('code', 'loading', 'מוחק תיקייה...');
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${folderPath}?ref=${GITHUB_BRANCH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    const items = await res.json();
    for (const item of items) {
      if (item.type === 'dir') await deleteFolder(item.path);
      else await deleteAnyFile(item.path, item.sha);
    }
    setStatus('code', 'ok', '✓ תיקייה נמחקה');
    loadFileTree(currentTreePath || '');
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

// ===== DELETE IMAGE =====


// ===== DROPZONE UPLOAD =====
function handleDrop(event) {
  event.preventDefault();
  const dropzone = document.getElementById('dropzone');
  dropzone.classList.remove('drag-over');
  const files = event.dataTransfer.files;
  if (!files.length) return;
  Array.from(files).forEach(file => uploadFile(file));
}

async function uploadFile(file) {
  const path = currentTreePath ? currentTreePath + '/' + file.name : file.name;
  setStatus('code', 'loading', 'מעלה ' + file.name + '...');
  try {
    // קרא את הקובץ כ-base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    // בדוק אם קובץ קיים (לקבל SHA)
    // העלאה בלבד — ללא החלפה
    const body = { message: 'העלאת קובץ: ' + path, content: base64, branch: GITHUB_BRANCH };
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (result.content) {
      setStatus('code', 'ok', '✓ ' + file.name + ' הועלה בהצלחה!');
      loadFileTree(currentTreePath || '');
    } else {
      setStatus('code', 'error', 'שגיאה: ' + (result.message || 'לא ידוע'));
    }
  } catch(e) {
    setStatus('code', 'error', 'שגיאה: ' + e.message);
  }
}

async function copyEditorContent() {
  const editor = document.getElementById('code-editor');
  if (!editor || !editor.value) return;
  copyToClipboard(editor.value, document.getElementById('editor-filename').textContent);
}

// override copyEditorContent with inline clipboard
async function copyEditorContent() {
  const editor = document.getElementById('code-editor');
  const filename = document.getElementById('editor-filename').textContent;
  if (!editor || !editor.value) return;
  const text = editor.value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setStatus('code', 'ok', '✓ ' + filename + ' הועתק ללוח');
  } catch(e) {
    setStatus('code', 'error', 'שגיאה בהעתקה');
  }
}

async function copyEditorContent() {
  const editor = document.getElementById('code-editor');
  const filename = document.getElementById('editor-filename').textContent;
  if (!editor || !editor.value) return;
  const text = editor.value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setStatus('code', 'ok', '✓ ' + filename + ' הועתק ללוח');
  } catch(e) {
    setStatus('code', 'error', 'שגיאה בהעתקה');
  }
}

// ===== TAB: BACKUPS =====
const MAX_BACKUPS = 10;

function backupPath(filename) {
  const now = new Date();
  const stamp = now.getFullYear() + '-' +
    String(now.getMonth()+1).padStart(2,'0') + '-' +
    String(now.getDate()).padStart(2,'0') + '_' +
    String(now.getHours()).padStart(2,'0') + '-' +
    String(now.getMinutes()).padStart(2,'0');
  return `backups/${filename.replace(/\//g,'--')}__${stamp}`;
}

async function autoBackup(filename) {
  try {
    const data = await ghGet(filename);
    const content = decode(data.content);
    const path = backupPath(filename);
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'גיבוי אוטומטי: ' + filename, content: btoa(unescape(encodeURIComponent(content))), branch: GITHUB_BRANCH })
    });
    await pruneBackups(filename);
  } catch(e) { /* fail silently */ }
}

async function pruneBackups(filename) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/backups?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) return;
    const files = await res.json();
    const prefix = filename.replace(/\//g,'--');
    const relevant = files.filter(f => f.name.startsWith(prefix)).sort((a,b) => a.name.localeCompare(b.name));
    const toDelete = relevant.slice(0, Math.max(0, relevant.length - MAX_BACKUPS));
    for (const f of toDelete) {
      await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${f.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'מחיקת גיבוי ישן', sha: f.sha, branch: GITHUB_BRANCH })
      });
    }
  } catch(e) { /* fail silently */ }
}

async function deleteBackup(path, sha, name) {
  confirmDelete(path, sha, 'file', name);
}

async function deleteSelectedBackups() {
  const checked = document.querySelectorAll('.backup-checkbox:checked');
  if (!checked.length) return;
  if (!confirm(`למחוק ${checked.length} גיבויים?`)) return;
  setStatus('backup', 'loading', 'מוחק...');
  for (const cb of checked) {
    try {
      await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${cb.dataset.path}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'מחיקת גיבוי', sha: cb.dataset.sha, branch: GITHUB_BRANCH })
      });
    } catch(e) {}
  }
  await ensureBackupsFolder();
  setStatus('backup', 'ok', 'נמחקו');
  loadBackups();
}

function toggleAllBackups(checked) {
  document.querySelectorAll('.backup-checkbox').forEach(cb => cb.checked = checked);
}

async function createBackup() {
  setStatus('backup', 'loading', 'מוריד גיבוי...');
  try {
    const stamp = new Date().toISOString().slice(0,16).replace('T','_').replace(/:/g,'-');
    const zipName = GITHUB_REPO + '__backup_' + stamp + '.zip';
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/zipball/${GITHUB_BRANCH}`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' } });
    if (!res.ok) throw new Error('שגיאה בהורדה');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = zipName;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus('backup', 'ok', 'גיבוי הורד: ' + zipName);
  } catch(e) {
    setStatus('backup', 'error', 'שגיאה: ' + e.message);
  }
}

async function ensureBackupsFolder() {
  try {
    await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/backups/.gitkeep`, {
      method: 'PUT',
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'שמירת תיקיית גיבויים', content: btoa(''), branch: GITHUB_BRANCH })
    });
  } catch(e) {}
}

async function loadBackups() {
  setStatus('backup', 'loading', 'טוען גיבויים...');
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/backups?ref=${GITHUB_BRANCH}&t=${Date.now()}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!res.ok) {
      document.getElementById('backup-list').innerHTML = '<div class="backup-empty">אין גיבויים עדיין</div>';
      setStatus('backup', 'ok', 'אין גיבויים עדיין');
      return;
    }
    const files = await res.json();
    if (!files.length) {
      document.getElementById('backup-list').innerHTML = '<div class="backup-empty">אין גיבויים עדיין</div>';
      setStatus('backup', 'ok', 'אין גיבויים עדיין');
      return;
    }
    const sorted = files.sort((a, b) => b.name.localeCompare(a.name));
    document.getElementById('backup-list').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 4px;margin-bottom:8px;border-bottom:1px solid var(--border);">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.8rem;color:var(--navy-light);">
          <input type="checkbox" onchange="toggleAllBackups(this.checked)"> סמן הכל
        </label>
        <button onclick="deleteSelectedBackups()" style="background:#fee2e2;color:#dc2626;border:none;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:0.75rem;font-weight:600;font-family:inherit;">🗑 מחק מסומנים</button>
      </div>
      ${sorted.map(f => {
        const parts = f.name.split('__');
        const origFile = parts[0];
        const stamp = parts[1] ? parts[1].replace('_',' ').replace(/-/g,'/').replace(/(\d{4}\/\d{2}\/\d{2}) (\d{2})\/(\d{2})/,'$1 $2:$3') : '';
        return `<div class="backup-item">
          <input type="checkbox" class="backup-checkbox" data-path="${f.path}" data-sha="${f.sha}" style="margin-left:8px;cursor:pointer;flex-shrink:0;">
          <div class="backup-info"><div class="backup-name">${origFile}</div><div class="backup-date">${stamp}</div></div>
          <div class="backup-actions"><button class="restore-btn" onclick="restoreBackup('${f.path}','${origFile}')">שחזר</button></div>
        </div>`;
      }).join('')}
    `;
    // נקה גיבויים ישנים לכל קובץ (בלי לטעון מחדש)
    const fileNames = [...new Set(files.map(f => f.name.split('__')[0]))];
    let toDeleteAll = [];
    for (const fname of fileNames) {
      const relevant = files.filter(f => f.name.startsWith(fname)).sort((a,b) => a.name.localeCompare(b.name));
      toDeleteAll = toDeleteAll.concat(relevant.slice(0, Math.max(0, relevant.length - MAX_BACKUPS)));
    }
    for (const f of toDeleteAll) {
      try {
        await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${f.path}`, {
          method: 'DELETE',
          headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'מחיקת גיבוי ישן', sha: f.sha, branch: GITHUB_BRANCH })
        });
      } catch(e) {}
    }
    const remaining = files.filter(f => !toDeleteAll.find(d => d.path === f.path));
    if (toDeleteAll.length) await ensureBackupsFolder();
    setStatus('backup', 'ok', `${remaining.length} גיבויים`);
  } catch(e) {
    setStatus('backup', 'error', 'שגיאה: ' + e.message);
  }
}

async function restoreBackup(bPath, targetFile) {
  if (!confirm(`לשחזר את ${targetFile}?\nהגרסה הנוכחית תיגבה לפני השחזור.`)) return;
  setStatus('backup', 'loading', 'משחזר...');
  try {
    const backupData = await ghGet(bPath);
    const content = decode(backupData.content);
    await autoBackup(targetFile);
    const current = await ghGet(targetFile);
    const result = await ghPut(targetFile, content, current.sha, 'שחזור ' + targetFile + ' מגיבוי');
    if (result.content) {
      setStatus('backup', 'ok', '' + targetFile + ' שוחזר בהצלחה!');
      if (targetFile === 'content.json') loadContent();
    } else {
      setStatus('backup', 'error', 'שגיאה בשחזור');
    }
  } catch(e) {
    setStatus('backup', 'error', 'שגיאה: ' + e.message);
  }
}

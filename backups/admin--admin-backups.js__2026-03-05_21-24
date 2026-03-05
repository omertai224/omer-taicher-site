// ===== TAB: BACKUPS =====
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
  } catch(e) { /* fail silently */ }
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
    setStatus('backup', 'ok', '✓ גיבוי הורד: ' + zipName);
  } catch(e) {
    setStatus('backup', 'error', 'שגיאה: ' + e.message);
  }
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
    document.getElementById('backup-list').innerHTML = sorted.map(f => {
      const parts = f.name.split('__');
      const origFile = parts[0];
      const stamp = parts[1] ? parts[1].replace('_',' ').replace(/-/g,'/').replace(/(\d{4}\/\d{2}\/\d{2}) (\d{2})\/(\d{2})/,'$1 $2:$3') : '';
      return `<div class="backup-item">
        <div class="backup-info"><div class="backup-name">${origFile}</div><div class="backup-date">${stamp}</div></div>
        <div class="backup-actions"><button class="restore-btn" onclick="restoreBackup('${f.path}','${origFile}')">שחזר</button></div>
      </div>`;
    }).join('');
    setStatus('backup', 'ok', `${files.length} גיבויים`);
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
      setStatus('backup', 'ok', '✓ ' + targetFile + ' שוחזר בהצלחה!');
      if (targetFile === 'content.json') loadContent();
    } else {
      setStatus('backup', 'error', 'שגיאה בשחזור');
    }
  } catch(e) {
    setStatus('backup', 'error', 'שגיאה: ' + e.message);
  }
}

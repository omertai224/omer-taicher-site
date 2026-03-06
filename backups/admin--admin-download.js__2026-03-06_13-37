// ===== TAB: DOWNLOAD =====
// הורדת גיבוי מלא של כל ריפוזיטורי ישירות מ-GitHub

function initDownloadTab() {
  renderDownloadList();
}

function renderDownloadList() {
  const container = document.getElementById('download-repo-list');
  if (!container) return;

  container.innerHTML = Object.entries(REPOS).map(([repoKey, repoMeta]) => {
    const id = 'dl-' + repoKey;
    return `
      <div style="
        background: white;
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 12px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      ">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;font-size:0.95rem;">${repoMeta.name}</div>
          <div style="font-family:monospace;font-size:0.7rem;color:var(--muted,#94a3b8);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            github.com/omertai224/${repoKey}
          </div>
        </div>
        <div id="${id}-status" style="font-size:0.75rem;color:var(--muted,#94a3b8);white-space:nowrap;"></div>
        <button
          id="${id}-btn"
          onclick="downloadRepo('${repoKey}', '${repoMeta.name}')"
          style="
            background: var(--orange, #f97316);
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            font-family: inherit;
            font-weight: 700;
            font-size: 0.82rem;
            cursor: pointer;
            white-space: nowrap;
            flex-shrink: 0;
            transition: opacity 0.2s;
          "
        >⬇️ הורד ZIP</button>
      </div>
    `;
  }).join('');
}

async function downloadRepo(repoKey, repoName) {
  const btn = document.getElementById(`dl-${repoKey}-btn`);
  const statusEl = document.getElementById(`dl-${repoKey}-status`);

  btn.disabled = true;
  btn.style.opacity = '0.5';
  btn.textContent = '⏳ מוריד...';
  if (statusEl) statusEl.textContent = '';
  setStatus('download', 'loading', `מוריד ${repoName}...`);

  try {
    const stamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
    const zipName = `${repoKey}__backup_${stamp}.zip`;

    // GitHub API: הורדת zipball של הריפוזיטורי
    const url = `https://api.github.com/repos/omertai224/${repoKey}/zipball/main`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) throw new Error(`שגיאה ${res.status}`);

    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = zipName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    if (statusEl) statusEl.textContent = `✓ ${sizeMB} MB`;
    setStatus('download', 'ok', `✓ ${repoName} הורד בהצלחה`);

  } catch (e) {
    if (statusEl) statusEl.textContent = '✗ שגיאה';
    setStatus('download', 'error', `שגיאה: ${e.message}`);
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = '⬇️ הורד ZIP';
  }
}

async function downloadAllRepos() {
  setStatus('download', 'loading', 'מוריד את כל הריפוזיטוריז...');
  const entries = Object.entries(REPOS);
  for (const [repoKey, repoMeta] of entries) {
    await downloadRepo(repoKey, repoMeta.name);
    // המתנה קצרה בין הורדות
    await new Promise(r => setTimeout(r, 800));
  }
  setStatus('download', 'ok', `✓ ${entries.length} ריפוזיטוריז הורדו`);
}

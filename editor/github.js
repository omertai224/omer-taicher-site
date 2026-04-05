/* ═══ GitHub Integration for Editor ═══ */

var GH = {
  token: '',
  user: 'omertai224',
  repo: 'omer-taicher-site',
  branch: 'claude/work-in-progress-j3LnH',
  mainBranch: 'main'
};

// ── Token Gate ──
function checkEditorToken() {
  GH.token = localStorage.getItem('gh_token') || '';
  if (!GH.token) {
    document.getElementById('editor-token-gate').style.display = 'flex';
    document.querySelector('.topbar').style.display = 'none';
    document.querySelector('.main').style.display = 'none';
    document.querySelector('.strip').style.display = 'none';
  } else {
    document.getElementById('editor-token-gate').style.display = 'none';
    document.querySelector('.topbar').style.display = '';
    document.querySelector('.main').style.display = '';
    document.querySelector('.strip').style.display = '';
    onEditorAuth();
  }
}

function editorSaveToken() {
  var input = document.getElementById('editor-token-input');
  var val = input.value.trim();
  if (!val) { showTokenError('נא להכניס טוקן'); return; }
  if (!/^(ghp_|github_pat_)/.test(val) || val.length < 20) {
    showTokenError('הטוקן לא נראה תקין');
    return;
  }
  var btn = document.getElementById('editor-token-btn');
  btn.textContent = 'מתחבר...';
  btn.disabled = true;

  fetch('https://api.github.com/user', {
    headers: { 'Authorization': 'token ' + val }
  })
  .then(function(r) {
    if (!r.ok) throw new Error('bad token');
    return r.json();
  })
  .then(function() {
    localStorage.setItem('gh_token', val);
    GH.token = val;
    document.getElementById('editor-token-gate').style.display = 'none';
    document.querySelector('.topbar').style.display = '';
    document.querySelector('.main').style.display = '';
    document.querySelector('.strip').style.display = '';
    onEditorAuth();
  })
  .catch(function() {
    btn.textContent = 'כניסה';
    btn.disabled = false;
    showTokenError('טוקן שגוי או אין חיבור');
  });
}

function showTokenError(msg) {
  var el = document.getElementById('editor-token-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'editor-token-error';
    el.style.cssText = 'color:#f6a67e;font-size:12px;font-weight:700;margin-top:10px;text-align:center;';
    document.getElementById('editor-token-btn').after(el);
  }
  el.textContent = msg;
}

function onEditorAuth() {
  // Ensure editor-work branch exists
  ensureBranch().then(function() {
    toast('מחובר ל-GitHub');
  });
}

// ── GitHub API helpers ──
function ghFetch(url, opts) {
  opts = opts || {};
  opts.headers = opts.headers || {};
  opts.headers['Authorization'] = 'token ' + GH.token;
  opts.headers['Accept'] = 'application/vnd.github.v3+json';
  return fetch(url, opts);
}

function ensureBranch() {
  var apiBase = 'https://api.github.com/repos/' + GH.user + '/' + GH.repo;
  // Check if editor-work branch exists
  return ghFetch(apiBase + '/git/ref/heads/' + GH.branch)
    .then(function(r) {
      if (r.ok) return; // branch exists
      // Create branch from main
      return ghFetch(apiBase + '/git/ref/heads/' + GH.mainBranch)
        .then(function(r2) { return r2.json(); })
        .then(function(mainRef) {
          return ghFetch(apiBase + '/git/refs', {
            method: 'POST',
            body: JSON.stringify({
              ref: 'refs/heads/' + GH.branch,
              sha: mainRef.object.sha
            })
          });
        });
    });
}

// ── Save to GitHub (commit slides.json) ──
function saveToGitHub() {
  if (!GH.token || !E.data || !E.name) {
    toast('אין מה לשמור');
    return Promise.resolve();
  }

  var path = 'interactive/tutorials/' + E.name + '/slides.json';
  var content = JSON.stringify(E.data, null, 2);
  var encoded = btoa(unescape(encodeURIComponent(content)));
  var apiBase = 'https://api.github.com/repos/' + GH.user + '/' + GH.repo;

  toast('שומר...');

  // Get current file SHA (if exists)
  return ghFetch(apiBase + '/contents/' + path + '?ref=' + GH.branch)
    .then(function(r) {
      if (r.ok) return r.json();
      return null;
    })
    .then(function(existing) {
      var body = {
        message: 'editor: ' + E.name + ' slides.json',
        content: encoded,
        branch: GH.branch
      };
      if (existing && existing.sha) body.sha = existing.sha;

      return ghFetch(apiBase + '/contents/' + path, {
        method: 'PUT',
        body: JSON.stringify(body)
      });
    })
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      E.modified = {};
      toast('נשמר ל-GitHub (' + GH.branch + ')');
      updatePushBtn();
    })
    .catch(function(err) {
      toast('שגיאה בשמירה: ' + err.message);
    });
}

// ── Push (merge editor-work to main) ──
function pushToMain() {
  if (!GH.token) return;
  var apiBase = 'https://api.github.com/repos/' + GH.user + '/' + GH.repo;

  toast('דוחף ל-main...');

  ghFetch(apiBase + '/merges', {
    method: 'POST',
    body: JSON.stringify({
      base: GH.mainBranch,
      head: GH.branch,
      commit_message: 'editor: publish changes'
    })
  })
  .then(function(r) {
    if (r.status === 204) { toast('אין שינויים לדחוף'); return; }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    toast('נדחף ל-main! Vercel יעשה deploy');
    // Update editor-work to match main
    return syncBranchToMain();
  })
  .catch(function(err) {
    toast('שגיאה בדחיפה: ' + err.message);
  });
}

function syncBranchToMain() {
  var apiBase = 'https://api.github.com/repos/' + GH.user + '/' + GH.repo;
  return ghFetch(apiBase + '/git/ref/heads/' + GH.mainBranch)
    .then(function(r) { return r.json(); })
    .then(function(ref) {
      return ghFetch(apiBase + '/git/ref/heads/' + GH.branch, {
        method: 'PATCH',
        body: JSON.stringify({ sha: ref.object.sha, force: true })
      });
    });
}

function updatePushBtn() {
  var btn = document.getElementById('btnPush');
  if (btn) btn.style.opacity = '1';
}

// ── Branch Indicator ──
function showBranchBadge() {
  var existing = document.getElementById('branch-badge');
  if (existing) existing.remove();
  var badge = document.createElement('div');
  badge.id = 'branch-badge';
  badge.style.cssText = 'position:fixed;top:6px;left:6px;z-index:9000;background:#1a2540ee;border:1px solid #ffffff22;border-radius:8px;padding:4px 10px;font-family:Rubik,sans-serif;font-size:11px;color:#ffffffaa;cursor:pointer;display:flex;align-items:center;gap:4px;';
  badge.title = 'לחצו לשנות בראנצ\'';
  badge.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2.5"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg> <span style="color:#f6a67e;font-weight:700;direction:ltr;">' + GH.branch + '</span>';
  badge.onclick = changeBranch;
  document.body.appendChild(badge);
}

function changeBranch() {
  toast('הבראנצ\' מוגדר בקוד. Claude משנה אותו בתחילת כל סשן.');
}

// ── Init on page load ──
document.addEventListener('DOMContentLoaded', function() {
  checkEditorToken();
  showBranchBadge();
});

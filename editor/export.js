/* ═══ Export & Save ═══ */

// Primary save: GitHub (if token) or download fallback
function saveData() {
  if (!E.data) return;

  // Visual feedback on disk icon
  var disk = document.getElementById('btnSave');
  if (disk) { disk.classList.add('saving'); setTimeout(function() { disk.classList.remove('saving'); }, 600); }

  // If we have GitHub token, save there
  if (typeof GH !== 'undefined' && GH.token) {
    saveToGitHub().then(function() { updateStatusBar(); });
    return;
  }

  // Fallback: download
  downloadJSON();
  updateStatusBar();
}

function updateStatusBar() {
  var el = document.getElementById('statusText');
  if (!el) return;
  var now = new Date();
  var h = String(now.getHours()).padStart(2, '0');
  var m = String(now.getMinutes()).padStart(2, '0');
  el.innerHTML = '<span class="saved">נשמר</span> ' + h + ':' + m;
}

// Download slides.json
function downloadJSON() {
  if (!E.data) return;
  var json = JSON.stringify(E.data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'slides.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('slides.json הורד');
}

// Copy JSON to clipboard
function copyJSON() {
  if (!E.data) return;
  var json = JSON.stringify(E.data, null, 2);
  navigator.clipboard.writeText(json).then(function() {
    toast('JSON הועתק ללוח');
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = json;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('JSON הועתק ללוח');
  });
}


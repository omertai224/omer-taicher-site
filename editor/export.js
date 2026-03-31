/* ═══ Export & Save ═══ */

// Primary save: GitHub (if token) or download fallback
function saveData() {
  if (!E.data) return;

  // Update cache
  updateCacheSlides(E.name, E.data);

  // If we have GitHub token, save there
  if (typeof GH !== 'undefined' && GH.token) {
    saveToGitHub();
    return;
  }

  // Fallback: download
  downloadJSON();
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

// Save directly to folder (File System Access API)
function saveToFolder() {
  if (!E.data) return;
  if (E.dirHandle) {
    E.dirHandle.getFileHandle('slides.json', { create: true })
      .then(function(fh) { return fh.createWritable(); })
      .then(function(writable) {
        var json = JSON.stringify(E.data, null, 2);
        return writable.write(json).then(function() { return writable.close(); });
      })
      .then(function() {
        E.original = JSON.parse(JSON.stringify(E.data));
        E.modified = {};
        updateStrip();
        toast('נשמר ישירות לתיקייה!');
      })
      .catch(function(err) { toast('שגיאה בשמירה: ' + err.message); });
    return;
  }
  downloadJSON();
}

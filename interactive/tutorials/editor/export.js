/* ═══ Export & Save ═══ */

// Download slides.json + update cache
function downloadJSON() {
  if (!E.data) return;
  var json = JSON.stringify(E.data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'slides.json';
  a.click();
  URL.revokeObjectURL(a.href);

  // Update cache with current edits so refresh keeps them
  updateCacheSlides(E.name, E.data);

  toast('slides.json הורד + cache עודכן');
}

// Copy JSON to clipboard
function copyJSON() {
  if (!E.data) return;
  var json = JSON.stringify(E.data, null, 2);
  navigator.clipboard.writeText(json).then(function() {
    toast('JSON הועתק ללוח');
  }).catch(function() {
    // Fallback
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

  // If we opened from local folder, save back
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

  // No folder handle - try Save As
  if (window.showSaveFilePicker) {
    window.showSaveFilePicker({
      suggestedName: 'slides.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
    })
    .then(function(fh) { return fh.createWritable(); })
    .then(function(writable) {
      var json = JSON.stringify(E.data, null, 2);
      return writable.write(json).then(function() { return writable.close(); });
    })
    .then(function() { toast('נשמר בהצלחה!'); })
    .catch(function(err) {
      if (err.name !== 'AbortError') toast('שגיאה: ' + err.message);
    });
  } else {
    // Fallback to download
    downloadJSON();
  }
}

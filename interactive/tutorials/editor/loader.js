/* ═══ Tutorial Loading ═══ */

/* ── Server mode: fetch with relative paths ── */
function loadFromServer(name) {
  E.path = '../' + name;
  E.name = name;
  E.imageMap = {};
  E.dirHandle = null;

  fetch(E.path + '/slides.json')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) { onDataLoaded(data); })
    .catch(function(err) { toast('שגיאה: ' + err.message); });
}

/* ── Local mode: pick ANY folder, find tutorials automatically ── */
function loadLocalRoot() {
  if (!window.showDirectoryPicker) {
    toast('הדפדפן לא תומך. השתמשו ב-Chrome או Edge');
    return;
  }
  window.showDirectoryPicker()
    .then(function(handle) {
      return findTutorials(handle);
    })
    .then(function(result) {
      if (!result) {
        toast('לא נמצאו הדרכות עם slides.json');
        return;
      }
      E.rootHandle = result.root;
      populateDropdown(result.names);
      toast('נמצאו ' + result.names.length + ' הדרכות. בחרו מהרשימה');
    })
    .catch(function(err) {
      if (err.name !== 'AbortError') toast('שגיאה: ' + err.message);
    });
}

/* ── Smart scan: check current folder, then 1 level deeper ── */
function findTutorials(handle) {
  // First: check if THIS folder contains tutorial subfolders
  return scanLevel(handle).then(function(names) {
    if (names.length > 0) {
      return { root: handle, names: names };
    }
    // Not found — check subfolders (user picked parent like "interactive" or repo root)
    return scanDeeper(handle);
  });
}

/* ── Scan one level: check each subfolder for slides.json ── */
function scanLevel(dirHandle) {
  var names = [];
  var iter = dirHandle.values();

  function next() {
    return iter.next().then(function(result) {
      if (result.done) { names.sort(); return names; }
      var entry = result.value;
      if (entry.kind !== 'directory' || entry.name === 'editor' || entry.name.startsWith('.')) {
        return next();
      }
      return entry.getFileHandle('slides.json')
        .then(function() { names.push(entry.name); })
        .catch(function() { /* no slides.json, skip */ })
        .then(next);
    });
  }
  return next();
}

/* ── Go one level deeper into each subfolder ── */
function scanDeeper(parentHandle) {
  var iter = parentHandle.values();
  var found = null;

  function next() {
    return iter.next().then(function(result) {
      if (result.done) return found;
      var entry = result.value;
      if (entry.kind !== 'directory' || entry.name.startsWith('.')) return next();
      return scanLevel(entry).then(function(names) {
        if (names.length > 0 && !found) {
          found = { root: entry, names: names };
        }
        return next();
      });
    });
  }
  return next();
}

/* ── Load a specific tutorial from the root handle ── */
function loadFromLocalRoot(name) {
  if (!E.rootHandle) return;

  E.rootHandle.getDirectoryHandle(name)
    .then(function(dirHandle) {
      E.dirHandle = dirHandle;
      E.name = name;
      E.path = '';
      return dirHandle.getFileHandle('slides.json');
    })
    .then(function(fh) { return fh.getFile(); })
    .then(function(file) { return file.text(); })
    .then(function(text) {
      var data = JSON.parse(text);
      return loadLocalImages(E.dirHandle).then(function() { return data; });
    })
    .then(function(data) { onDataLoaded(data); })
    .catch(function(err) { toast('שגיאה: ' + err.message); });
}

/* ── Load all images from images/ subfolder ── */
function loadLocalImages(dirHandle) {
  E.imageMap = {};
  return dirHandle.getDirectoryHandle('images')
    .then(function(imgDir) {
      var promises = [];
      var iter = imgDir.values();
      function next() {
        return iter.next().then(function(result) {
          if (result.done) return Promise.all(promises);
          var entry = result.value;
          if (entry.kind === 'file' && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(entry.name)) {
            promises.push(entry.getFile().then(function(file) {
              E.imageMap[entry.name] = URL.createObjectURL(file);
            }));
          }
          return next();
        });
      }
      return next();
    })
    .catch(function() {
      toast('לא נמצאה תיקיית images/');
    });
}

/* ── Common handler after data is loaded ── */
function onDataLoaded(data) {
  E.data = data;
  E.original = JSON.parse(JSON.stringify(data));
  E.idx = 0;
  E.modified = {};
  E.zoom = 1;
  $('slideContainer').style.transform = '';
  buildStrip();
  showSlide(0);
  toast(E.name + ' נטען (' + data.slides.length + ' שקפים)');
}

/* ── Get image URL (server path or local blob) ── */
function getImageUrl(filename) {
  if (E.imageMap[filename]) return E.imageMap[filename];
  return E.path + '/images/' + filename;
}

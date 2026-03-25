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

/* ── Local mode: pick tutorials/ root folder, scan for tutorials ── */
function loadLocalRoot() {
  if (!window.showDirectoryPicker) {
    toast('הדפדפן לא תומך. השתמשו ב-Chrome או Edge');
    return;
  }
  window.showDirectoryPicker()
    .then(function(rootHandle) {
      E.rootHandle = rootHandle;
      return scanForTutorials(rootHandle);
    })
    .then(function(names) {
      if (names.length === 0) {
        toast('לא נמצאו הדרכות עם slides.json');
        return;
      }
      populateDropdown(names);
      toast('נמצאו ' + names.length + ' הדרכות. בחרו מהרשימה');
    })
    .catch(function(err) {
      if (err.name !== 'AbortError') toast('שגיאה: ' + err.message);
    });
}

/* ── Scan root folder for subfolders with slides.json ── */
function scanForTutorials(rootHandle) {
  var names = [];
  var iter = rootHandle.values();

  function processEntries() {
    return iter.next().then(function(result) {
      if (result.done) {
        names.sort();
        return names;
      }
      var entry = result.value;
      if (entry.kind !== 'directory' || entry.name === 'editor') {
        return processEntries();
      }
      // Check if this folder has slides.json
      return entry.getFileHandle('slides.json')
        .then(function() {
          names.push(entry.name);
        })
        .catch(function() {
          // No slides.json — skip
        })
        .then(processEntries);
    });
  }
  return processEntries();
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
      function processEntries() {
        return iter.next().then(function(result) {
          if (result.done) return Promise.all(promises);
          var entry = result.value;
          if (entry.kind === 'file' && /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(entry.name)) {
            var p = entry.getFile().then(function(file) {
              E.imageMap[entry.name] = URL.createObjectURL(file);
            });
            promises.push(p);
          }
          return processEntries();
        });
      }
      return processEntries();
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

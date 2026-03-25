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

/* ── Local mode: folder picker that works on file:// ── */
// Hidden file input for folder selection
var _folderInput = document.createElement('input');
_folderInput.type = 'file';
_folderInput.webkitdirectory = true;
_folderInput.multiple = true;
_folderInput.style.display = 'none';
document.body.appendChild(_folderInput);

_folderInput.addEventListener('change', function() {
  if (!this.files || this.files.length === 0) return;
  processFolderFiles(this.files);
  this.value = ''; // reset for re-use
});

function loadLocalRoot() {
  _folderInput.click();
}

/* ── Process files from folder picker ── */
function processFolderFiles(fileList) {
  // Build a map: tutorialName -> { slides: File, images: {name: File} }
  var tutorials = {};

  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    var path = file.webkitRelativePath; // e.g. "tutorials/Clipboard/slides.json"
    var parts = path.split('/');

    // Find slides.json — could be at depth 1 (Clipboard/slides.json)
    // or depth 2 (tutorials/Clipboard/slides.json)
    var slidesIdx = -1;
    for (var j = 0; j < parts.length; j++) {
      if (parts[j] === 'slides.json') { slidesIdx = j; break; }
    }

    if (slidesIdx >= 1) {
      var tutName = parts[slidesIdx - 1];
      if (tutName === 'editor') continue;
      if (!tutorials[tutName]) tutorials[tutName] = { slides: null, images: {} };
      tutorials[tutName].slides = file;
      continue;
    }

    // Find images — look for /images/filename.png
    var imgIdx = -1;
    for (var k = 0; k < parts.length; k++) {
      if (parts[k] === 'images') { imgIdx = k; break; }
    }

    if (imgIdx >= 1 && imgIdx < parts.length - 1) {
      var tutNameImg = parts[imgIdx - 1];
      if (tutNameImg === 'editor' || tutNameImg === 'shared') continue;
      var imgName = parts[parts.length - 1];
      if (/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(imgName)) {
        if (!tutorials[tutNameImg]) tutorials[tutNameImg] = { slides: null, images: {} };
        tutorials[tutNameImg].images[imgName] = file;
      }
    }
  }

  // Filter: only tutorials with slides.json
  var names = [];
  for (var name in tutorials) {
    if (tutorials[name].slides) names.push(name);
  }
  names.sort();

  if (names.length === 0) {
    toast('לא נמצאו הדרכות עם slides.json');
    return;
  }

  // Store for later loading
  E.localTutorials = tutorials;
  populateDropdown(names);
  toast('נמצאו ' + names.length + ' הדרכות. בחרו מהרשימה');
}

/* ── Load a tutorial from local file data ── */
function loadFromLocalRoot(name) {
  var tut = E.localTutorials && E.localTutorials[name];
  if (!tut || !tut.slides) {
    toast('הדרכה לא נמצאה: ' + name);
    return;
  }

  E.name = name;
  E.path = '';
  E.dirHandle = null;

  // Create blob URLs for images
  E.imageMap = {};
  for (var imgName in tut.images) {
    E.imageMap[imgName] = URL.createObjectURL(tut.images[imgName]);
  }

  // Read slides.json
  var reader = new FileReader();
  reader.onload = function() {
    try {
      var data = JSON.parse(reader.result);
      onDataLoaded(data);
    } catch (err) {
      toast('שגיאה בקריאת JSON: ' + err.message);
    }
  };
  reader.readAsText(tut.slides);
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

/* ── Save: download updated slides.json ── */
// (saveToFolder moved to export.js)

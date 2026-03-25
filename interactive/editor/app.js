/* ═══ Editor State & Init ═══ */

var E = {
  data: null,           // current slides JSON (mutable)
  original: null,       // deep copy for reset
  idx: 0,               // current slide index (0-based)
  path: '',             // tutorial path (e.g. "../tutorials/Clipboard")
  name: '',             // tutorial name
  imageMap: {},          // local files: filename -> blob URL
  dirHandle: null,       // File System Access API handle
  modified: {},          // slide index -> true if changed
  zoom: 1,
};

// Known tutorials
var TUTORIALS = ['Clipboard', 'Everything', 'Vibe'];

// DOM cache
var $ = function(id) { return document.getElementById(id); };

// Toast
function toast(msg) {
  var t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.classList.remove('show'); }, 2200);
}

// Mark slide as modified
function markModified(idx) {
  if (idx === undefined) idx = E.idx;
  E.modified[idx] = true;
  updateStrip();
}

// Init
(function init() {
  var sel = $('tutorialSelect');
  TUTORIALS.forEach(function(t) {
    var o = document.createElement('option');
    o.value = t; o.textContent = t;
    sel.appendChild(o);
  });

  // URL param
  var p = new URLSearchParams(window.location.search);
  var t = p.get('t');
  if (t) { sel.value = t; loadFromServer(t); }

  sel.addEventListener('change', function() {
    if (this.value) loadFromServer(this.value);
  });

  // Keyboard
  document.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); downloadJSON(); }
  });

  // Button bindings
  $('btnPrev').onclick = goPrev;
  $('btnNext').onclick = goNext;
  $('btnZoomIn').onclick = function() { setZoom(E.zoom * 1.15); };
  $('btnZoomOut').onclick = function() { setZoom(E.zoom / 1.15); };
  $('btnZoomFit').onclick = function() { setZoom(1); };
  $('btnLoadLocal').onclick = loadLocal;
  $('btnSave').onclick = saveToFolder;
  $('btnDownload').onclick = downloadJSON;
  $('btnCopy').onclick = copyJSON;

  buildPanel();
})();

// Zoom
function setZoom(z) {
  E.zoom = Math.max(0.3, Math.min(3, z));
  $('slideContainer').style.transform = 'scale(' + E.zoom + ')';
}

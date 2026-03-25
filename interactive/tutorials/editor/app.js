/* ═══ Editor State & Init ═══ */

var E = {
  data: null,           // current slides JSON (mutable)
  original: null,       // deep copy for reset
  idx: 0,               // current slide index (0-based)
  path: '',             // tutorial path (e.g. "../Clipboard")
  name: '',             // tutorial name
  imageMap: {},          // local files: filename -> blob URL
  dirHandle: null,       // File System Access API handle
  modified: {},          // slide index -> true if changed
  zoom: 1,
};

// Known tutorials — auto-populated, plus fallback list
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

// Populate dropdown with tutorials that have slides.json
function populateDropdown() {
  var sel = $('tutorialSelect');
  var added = {};
  TUTORIALS.forEach(function(name) {
    if (added[name]) return;
    added[name] = true;
    var o = document.createElement('option');
    o.value = name; o.textContent = name;
    sel.appendChild(o);
  });
}

// Init
(function init() {
  populateDropdown();

  var sel = $('tutorialSelect');

  // URL param
  var p = new URLSearchParams(window.location.search);
  var t = p.get('t');
  if (t) {
    // Add to dropdown if not in list
    if (!sel.querySelector('option[value="' + t + '"]')) {
      var o = document.createElement('option');
      o.value = t; o.textContent = t;
      sel.appendChild(o);
    }
    sel.value = t;
    loadFromServer(t);
  }

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

/* ═══ Editor State & Init ═══ */

var E = {
  data: null,           // current slides JSON (mutable)
  original: null,       // deep copy for reset
  idx: 0,               // current slide index (0-based)
  path: '',             // tutorial path (e.g. "/interactive/tutorials/Clipboard")
  name: '',             // tutorial name
  imageMap: {},          // drag-drop files: filename -> blob URL
  modified: {},          // slide index -> true if changed
  zoom: 1,
};

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

// Zoom — scale + resize canvas-inner so scrollbars appear in both directions
function setZoom(z) {
  E.zoom = Math.max(0.5, Math.min(5, z));
  var sc = $('slideContainer');
  var ci = $('canvasInner');
  sc.style.transform = 'scale(' + E.zoom + ')';

  if (E.zoom > 1) {
    var img = $('slideImg');
    var w = (img.offsetWidth || 800) * E.zoom + 100;
    var h = (img.offsetHeight || 600) * E.zoom + 100;
    ci.style.width = w + 'px';
    ci.style.height = h + 'px';
    ci.style.minWidth = w + 'px';
    ci.style.minHeight = h + 'px';
    // Align to top-left so scroll reaches all edges
    ci.style.alignItems = 'flex-start';
    ci.style.justifyContent = 'flex-start';
    ci.style.padding = '30px';
  } else {
    ci.style.width = '';
    ci.style.height = '';
    ci.style.minWidth = '100%';
    ci.style.minHeight = '100%';
    ci.style.alignItems = 'center';
    ci.style.justifyContent = 'center';
    ci.style.padding = '';
  }
}

// Ctrl+scroll = zoom, plain scroll = pan
document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('canvasArea');
  if (canvas) {
    canvas.addEventListener('wheel', function(e) {
      if (e.ctrlKey) {
        e.preventDefault();
        var delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(E.zoom * delta);
      }
      // Without Ctrl: normal scroll = pan (default browser behavior)
    }, { passive: false });
  }
});

// Init — runs after ALL scripts are loaded
window.addEventListener('DOMContentLoaded', function() {

  // Button bindings
  $('btnPrev').onclick = function() { goPrev(); };
  $('btnNext').onclick = function() { goNext(); };
  $('btnZoomIn').onclick = function() { setZoom(E.zoom * 1.15); };
  $('btnZoomOut').onclick = function() { setZoom(E.zoom / 1.15); };
  $('btnZoomFit').onclick = function() { setZoom(1); };
  $('btnSave').onclick = function() { saveData(); };

  // Keyboard
  document.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); downloadJSON(); }
  });

  buildPanel();

  // Dropdown change handler
  $('tutorialSelect').addEventListener('change', function() {
    if (!this.value) return;
    loadFromServer(this.value);
  });

  // Populate dropdown, support URL param
  populateDropdown(KNOWN_TUTORIALS);

  var p = new URLSearchParams(window.location.search);
  var t = p.get('t');
  if (t) {
    addToDropdown(t);
    $('tutorialSelect').value = t;
    loadFromServer(t);
  }
});

// Add tutorials to dropdown
function populateDropdown(names) {
  var sel = $('tutorialSelect');
  // Clear existing options except the first placeholder
  while (sel.options.length > 1) sel.remove(1);
  names.forEach(function(name) { addToDropdown(name); });
}

function addToDropdown(name) {
  var sel = $('tutorialSelect');
  if (sel.querySelector('option[value="' + name + '"]')) return;
  var o = document.createElement('option');
  o.value = name; o.textContent = name;
  sel.appendChild(o);
}

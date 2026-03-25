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
  isLocal: location.protocol === 'file:',
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

// Zoom
function setZoom(z) {
  E.zoom = Math.max(0.3, Math.min(3, z));
  $('slideContainer').style.transform = 'scale(' + E.zoom + ')';
}

// Init — runs after ALL scripts are loaded
window.addEventListener('DOMContentLoaded', function() {

  // Button bindings
  $('btnPrev').onclick = function() { goPrev(); };
  $('btnNext').onclick = function() { goNext(); };
  $('btnZoomIn').onclick = function() { setZoom(E.zoom * 1.15); };
  $('btnZoomOut').onclick = function() { setZoom(E.zoom / 1.15); };
  $('btnZoomFit').onclick = function() { setZoom(1); };
  $('btnLoadLocal').onclick = function() { loadLocal(); };
  $('btnSave').onclick = function() { saveToFolder(); };
  $('btnDownload').onclick = function() { downloadJSON(); };
  $('btnCopy').onclick = function() { copyJSON(); };

  // Keyboard
  document.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); downloadJSON(); }
  });

  buildPanel();

  if (E.isLocal) {
    // ── Local mode: hide dropdown, show browse message ──
    $('tutorialSelect').style.display = 'none';
    $('noSlide').innerHTML = '<div style="font-size:20px;color:#f6a67e;margin-bottom:16px;">עורך בועות</div>'
      + '<div style="margin-bottom:20px;color:#ffffffaa;">לחצו על הכפתור למעלה כדי לטעון תיקיית הדרכה</div>'
      + '<div style="font-size:11px;color:#ffffff44;">או גררו תיקיית הדרכה לכאן</div>';
  } else {
    // ── Server mode: populate dropdown, support URL param ──
    var sel = $('tutorialSelect');
    TUTORIALS.forEach(function(name) {
      var o = document.createElement('option');
      o.value = name; o.textContent = name;
      sel.appendChild(o);
    });

    var p = new URLSearchParams(window.location.search);
    var t = p.get('t');
    if (t) {
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
  }
});

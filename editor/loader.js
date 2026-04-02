/* ═══ Tutorial Loading (server mode) ═══ */

/* Base path for tutorials on the server */
var TUTORIALS_BASE = '/interactive/tutorials/';

/* Known tutorials organized by category */
var TUTORIAL_CATEGORIES = [
  { label: 'Gmail', items: ['Gmail/Schedule', 'Gmail/Stars'] },
  { label: 'Chrome', items: ['Chrome/WebApp'] },
  { label: 'Windows', items: ['Clipboard'] },
  { label: 'Apps', items: ['Vibe', 'Everything'] }
];

/* Flat list for backwards compatibility */
var KNOWN_TUTORIALS = [];
TUTORIAL_CATEGORIES.forEach(function(cat) {
  cat.items.forEach(function(t) { KNOWN_TUTORIALS.push(t); });
});

/* Fetch tutorial from server */
function loadFromServer(name) {
  E.path = TUTORIALS_BASE + name;
  E.name = name;
  E.imageMap = {};

  fetch(E.path + '/slides.json')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) { onDataLoaded(data); })
    .catch(function(err) { toast('שגיאה: ' + err.message); });
}

/* Common handler after data is loaded */
function onDataLoaded(data) {
  E.data = data;
  E.original = JSON.parse(JSON.stringify(data));
  E.idx = 0;
  E.modified = {};
  E.zoom = 1;
  $('slideContainer').style.transform = '';
  // Read saved position BEFORE showSlide overwrites it
  var lastIdx = parseInt(localStorage.getItem('editor_last_slide_' + E.name)) || 0;
  if (lastIdx >= data.slides.length) lastIdx = 0;
  buildStrip();
  showSlide(lastIdx);
  // Remember last tutorial
  localStorage.setItem('editor_last', E.name);
  // Update "open" link
  var openBtn = document.getElementById('btnOpenTutorial');
  if (openBtn) {
    openBtn.href = '/interactive/tutorials/' + E.name + '/';
    openBtn.style.display = '';
  }
  toast(E.name + ' נטען (' + data.slides.length + ' שקפים)');
}

/* Save current slide position (called from showSlide) */
function rememberSlide() {
  if (E.name) localStorage.setItem('editor_last_slide_' + E.name, E.idx);
}

/* Auto-load last tutorial on page refresh */
function tryRestoreLast() {
  var last = localStorage.getItem('editor_last');
  if (!last) return;
  if (typeof selectTutorial === 'function') selectTutorial(last);
  else loadFromServer(last);
}

/* Get image URL (server path or local blob from drag-drop) */
function getImageUrl(filename) {
  if (E.imageMap[filename]) return E.imageMap[filename];
  return E.path + '/images/' + filename;
}

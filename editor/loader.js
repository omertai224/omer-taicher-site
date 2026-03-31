/* ═══ Tutorial Loading (server mode) ═══ */

/* Base path for tutorials on the server */
var TUTORIALS_BASE = '/interactive/tutorials/';

/* Known tutorials for the dropdown */
var KNOWN_TUTORIALS = ['Clipboard', 'Everything', 'Vibe', 'Gmail/Schedule'];

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
  buildStrip();
  showSlide(0);
  toast(E.name + ' נטען (' + data.slides.length + ' שקפים)');
}

/* Get image URL (server path or local blob from drag-drop) */
function getImageUrl(filename) {
  if (E.imageMap[filename]) return E.imageMap[filename];
  return E.path + '/images/' + filename;
}

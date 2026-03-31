/* ═══ Notes: internal annotations per slide ═══ */

// Add a new note to current slide
function addNote() {
  if (!E.data || !E.data.slides || !E.data.slides[E.idx]) { toast('טענו הדרכה קודם'); return; }
  var s = E.data.slides[E.idx];
  saveUndo();
  if (!s.notes) s.notes = [];
  s.notes.push({
    text: 'הערה חדשה',
    left: '50%',
    top: '50%'
  });
  renderNotes(s);
  markModified();
  toast('הערה נוספה. גררו למיקום');
}

// Remove a note by index
function removeNote(idx) {
  var s = E.data.slides[E.idx];
  if (!s.notes || !s.notes[idx]) return;
  saveUndo();
  s.notes.splice(idx, 1);
  renderNotes(s);
  markModified();
  toast('הערה הוסרה');
}

// Render notes on image + list in panel
function renderNotes(slide) {
  // Remove old note markers from canvas
  var old = document.querySelectorAll('.note-marker');
  for (var i = 0; i < old.length; i++) old[i].remove();

  // Panel list
  var list = $('notesList');
  if (list) list.innerHTML = '';

  if (!slide.notes || slide.notes.length === 0) return;

  var container = $('slideContainer');
  var hasImage = container && container.style.display !== 'none';

  slide.notes.forEach(function(note, idx) {
    // Create marker on canvas (only for image slides)
    if (hasImage) {
      var marker = document.createElement('div');
      marker.className = 'note-marker';
      marker.style.left = note.left;
      marker.style.top = note.top;
      marker.innerHTML = '<span class="note-num">' + (idx + 1) + '</span>';
      marker.title = note.text;
      marker.dataset.idx = idx;
      container.appendChild(marker);
      initNoteDrag(marker, idx);
    }

    // Panel entry
    if (list) {
      var entry = document.createElement('div');
      entry.className = 'note-entry';
      entry.innerHTML = '<div class="note-header">'
        + '<span class="note-badge">' + (idx + 1) + '</span>'
        + '<span class="mic-btn" onclick="toggleSpeech(' + idx + ')" title="הקלט הערה"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></span>'
        + '<span class="note-del" onclick="removeNote(' + idx + ')" title="מחק">&times;</span>'
        + '</div>'
        + '<textarea class="note-input" oninput="updateNoteText(' + idx + ', this.value)" placeholder="הערה...">' + escHtml(note.text) + '</textarea>';
      list.appendChild(entry);
    }
  });
}

// Update note text from panel input
function updateNoteText(idx, text) {
  var s = E.data.slides[E.idx];
  if (!s.notes || !s.notes[idx]) return;
  s.notes[idx].text = text;
  // Update marker title
  var markers = document.querySelectorAll('.note-marker');
  if (markers[idx]) markers[idx].title = text;
  markModified();
}

// Dragging notes
function initNoteDrag(marker, noteIdx) {
  var dragging = false;
  var startX, startY, startLeft, startTop, cw, ch;

  marker.addEventListener('mousedown', function(e) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    var container = $('slideContainer');
    var rect = container.getBoundingClientRect();
    cw = rect.width;
    ch = rect.height;
    var mRect = marker.getBoundingClientRect();
    startLeft = mRect.left - rect.left;
    startTop = mRect.top - rect.top;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var newLeft = startLeft + (e.clientX - startX);
    var newTop = startTop + (e.clientY - startY);
    var leftPct = Math.max(0, Math.min(95, (newLeft / cw) * 100));
    var topPct = Math.max(0, Math.min(95, (newTop / ch) * 100));
    marker.style.left = leftPct + '%';
    marker.style.top = topPct + '%';
  });

  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    var s = E.data.slides[E.idx];
    if (s.notes && s.notes[noteIdx]) {
      s.notes[noteIdx].left = marker.style.left;
      s.notes[noteIdx].top = marker.style.top;
      markModified();
    }
  });
}

// Escape HTML for input value
function escHtml(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

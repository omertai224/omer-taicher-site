/* ═══ Notes: internal annotations per slide ═══ */

// Add a new note to current slide
function addNote() {
  var s = E.data.slides[E.idx];
  if (!s.image) { toast('הערות רק בשקפי תמונה'); return; }
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

  slide.notes.forEach(function(note, idx) {
    // Create marker on canvas
    var marker = document.createElement('div');
    marker.className = 'note-marker';
    marker.style.left = note.left;
    marker.style.top = note.top;
    marker.innerHTML = '<span class="note-num">' + (idx + 1) + '</span>';
    marker.title = note.text;
    marker.dataset.idx = idx;
    container.appendChild(marker);

    // Make marker draggable
    initNoteDrag(marker, idx);

    // Panel entry
    if (list) {
      var entry = document.createElement('div');
      entry.className = 'note-entry';
      entry.innerHTML = '<span class="note-badge">' + (idx + 1) + '</span>'
        + '<input class="note-input" value="' + escHtml(note.text) + '" '
        + 'oninput="updateNoteText(' + idx + ', this.value)" placeholder="הערה...">'
        + '<span class="note-del" onclick="removeNote(' + idx + ')" title="מחק">&times;</span>';
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

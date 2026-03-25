/* ═══ Box Dragging & Resizing ═══ */

(function() {
  var box = document.getElementById('editorBox');
  var mode = null; // 'drag' | 'tl' | 'tr' | 'bl' | 'br'
  var startX, startY;
  var startTop, startBottom, startLeft, startRight;
  var cw, ch;

  box.addEventListener('mousedown', function(e) {
    var s = E.data && E.data.slides[E.idx];
    if (!s || !s.box) return;

    // Determine mode
    if (e.target.classList.contains('resize-handle')) {
      mode = e.target.dataset.handle;
    } else {
      mode = 'drag';
    }

    saveUndo();
    startX = e.clientX;
    startY = e.clientY;
    startTop = parseFloat(s.box.top);
    startBottom = parseFloat(s.box.bottom);
    startLeft = parseFloat(s.box.left);
    startRight = parseFloat(s.box.right);

    var rect = document.getElementById('slideContainer').getBoundingClientRect();
    cw = rect.width;
    ch = rect.height;

    box.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!mode) return;

    var dxPct = ((e.clientX - startX) / cw) * 100;
    var dyPct = ((e.clientY - startY) / ch) * 100;

    var nT = startTop, nB = startBottom, nL = startLeft, nR = startRight;

    if (mode === 'drag') {
      nT = startTop + dyPct;
      nB = startBottom - dyPct;
      nL = startLeft + dxPct;
      nR = startRight - dxPct;
    } else {
      if (mode.includes('t')) nT = startTop + dyPct;
      if (mode.includes('b')) nB = startBottom - dyPct;
      if (mode.includes('l')) nL = startLeft + dxPct;
      if (mode.includes('r')) nR = startRight - dxPct;
    }

    box.style.top = nT + '%';
    box.style.bottom = nB + '%';
    box.style.left = nL + '%';
    box.style.right = nR + '%';

    // Update panel live
    updateBoxFields(nT, nB, nL, nR);
  });

  document.addEventListener('mouseup', function() {
    if (!mode) return;
    box.classList.remove('dragging');

    // Save to data
    var s = E.data.slides[E.idx];
    if (s && s.box) {
      s.box.top = box.style.top;
      s.box.bottom = box.style.bottom;
      s.box.left = box.style.left;
      s.box.right = box.style.right;
      markModified();
    }
    mode = null;
  });
})();

// Nudge box by percentage
function nudgeBox(dLeft, dTop) {
  var s = E.data && E.data.slides[E.idx];
  if (!s || !s.box) return;
  saveUndo();

  var t = parseFloat(s.box.top) + dTop;
  var b = parseFloat(s.box.bottom) - dTop;
  var l = parseFloat(s.box.left) + dLeft;
  var r = parseFloat(s.box.right) - dLeft;

  s.box.top = t + '%';
  s.box.bottom = b + '%';
  s.box.left = l + '%';
  s.box.right = r + '%';

  renderBox(s);
  updateBoxFields(t, b, l, r);
  markModified();
}

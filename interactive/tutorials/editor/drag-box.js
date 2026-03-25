/* ═══ Box Dragging & Resizing ═══ */

// Clamp box values so it stays inside the image (all values >= 0)
function clampBox(nT, nB, nL, nR) {
  if (nT < 0) { nB += nT; nT = 0; }
  if (nB < 0) { nT += nB; nB = 0; }
  if (nL < 0) { nR += nL; nL = 0; }
  if (nR < 0) { nL += nR; nR = 0; }
  nT = Math.max(0, nT);
  nB = Math.max(0, nB);
  nL = Math.max(0, nL);
  nR = Math.max(0, nR);
  return { t: nT, b: nB, l: nL, r: nR };
}

(function() {
  var box = document.getElementById('editorBox');
  var mode = null;
  var startX, startY;
  var startTop, startBottom, startLeft, startRight;
  var cw, ch;

  box.addEventListener('mousedown', function(e) {
    var s = E.data && E.data.slides[E.idx];
    if (!s || !s.box) return;

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

    var c = clampBox(nT, nB, nL, nR);
    box.style.top = c.t + '%';
    box.style.bottom = c.b + '%';
    box.style.left = c.l + '%';
    box.style.right = c.r + '%';
  });

  document.addEventListener('mouseup', function() {
    if (!mode) return;
    box.classList.remove('dragging');

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

  var nT = parseFloat(s.box.top) + dTop;
  var nB = parseFloat(s.box.bottom) - dTop;
  var nL = parseFloat(s.box.left) + dLeft;
  var nR = parseFloat(s.box.right) - dLeft;

  var c = clampBox(nT, nB, nL, nR);
  s.box.top = c.t + '%';
  s.box.bottom = c.b + '%';
  s.box.left = c.l + '%';
  s.box.right = c.r + '%';

  renderBox(s);
  markModified();
}

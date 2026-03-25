/* ═══ Bubble Dragging & Resizing ═══ */

(function() {
  var bubble = document.getElementById('editorBubble');
  var mode = null; // 'drag' or 'resize'
  var startX, startY, startBubbleLeft, startBubbleTop, startWidth;
  var cw, ch, containerRect;

  bubble.addEventListener('mousedown', function(e) {
    var s = E.data && E.data.slides[E.idx];
    if (!s || !s.textPos) return;

    // Check if resize handle clicked
    if (e.target.classList.contains('bubble-resize')) {
      mode = 'resize';
      startWidth = bubble.offsetWidth;
    } else {
      mode = 'drag';
    }

    saveUndo();
    startX = e.clientX;
    startY = e.clientY;
    containerRect = document.getElementById('slideContainer').getBoundingClientRect();
    cw = containerRect.width;
    ch = containerRect.height;

    var bubbleRect = bubble.getBoundingClientRect();
    startBubbleLeft = bubbleRect.left - containerRect.left;
    startBubbleTop = bubbleRect.top - containerRect.top;

    bubble.classList.add('dragging');
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', function(e) {
    if (!mode) return;

    if (mode === 'resize') {
      // Resize: width in pixels (text doesn't reflow). Scale handles proportions.
      var dx = e.clientX - startX;
      var newWidth = Math.max(150, Math.min(500, startWidth + dx));
      bubble.style.maxWidth = newWidth + 'px';
      bubble.style.width = newWidth + 'px';
      return;
    }

    // Drag
    var newLeftPx = startBubbleLeft + (e.clientX - startX);
    var newTopPx = startBubbleTop + (e.clientY - startY);

    var bubbleW = bubble.offsetWidth;
    var bubbleH = bubble.offsetHeight;
    newLeftPx = Math.max(0, Math.min(newLeftPx, cw - bubbleW));
    newTopPx = Math.max(0, Math.min(newTopPx, ch - bubbleH));

    var leftPct = (newLeftPx / cw) * 100;
    var topPct = (newTopPx / ch) * 100;

    var s = E.data.slides[E.idx];
    var usesBottom = s.textPos.bottom && !s.textPos.top;

    bubble.style.left = leftPct + '%';
    // Always use top positioning (not bottom) for consistency
    bubble.style.bottom = '';
    bubble.style.top = topPct + '%';
  });

  document.addEventListener('mouseup', function() {
    if (!mode) return;
    var prevMode = mode;
    mode = null;
    bubble.classList.remove('dragging');

    var s = E.data.slides[E.idx];
    if (!s || !s.textPos) return;

    if (prevMode === 'resize') {
      s.textWidth = bubble.offsetWidth + 'px';
      markModified();
      return;
    }

    // Always save as left + top (never bottom)
    s.textPos.left = bubble.style.left;
    s.textPos.top = bubble.style.top;
    delete s.textPos.bottom;

    markModified();
  });
})();

// Nudge bubble by percentage (clamped)
function nudgeBubble(dLeft, dTop) {
  var s = E.data && E.data.slides[E.idx];
  if (!s || !s.textPos) return;
  saveUndo();

  var left = parseFloat(s.textPos.left) || 0;
  var usesBottom = s.textPos.bottom && !s.textPos.top;

  left = Math.max(0, Math.min(95, left + dLeft));
  s.textPos.left = left + '%';

  // Always use top (convert from bottom if needed)
  var top = parseFloat(s.textPos.top) || 0;
  top = Math.max(0, Math.min(95, top + dTop));
  s.textPos.top = top + '%';
  delete s.textPos.bottom;

  renderBubble(s);
  markModified();
}

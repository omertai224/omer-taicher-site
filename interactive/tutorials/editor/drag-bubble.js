/* ═══ Bubble Dragging ═══ */

(function() {
  var bubble = document.getElementById('editorBubble');
  var dragging = false;
  var startX, startY, startBubbleLeft, startBubbleTop;
  var cw, ch, containerRect;

  bubble.addEventListener('mousedown', function(e) {
    var s = E.data && E.data.slides[E.idx];
    if (!s || !s.textPos) return;

    dragging = true;
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
  });

  document.addEventListener('mousemove', function(e) {
    if (!dragging) return;

    var newLeftPx = startBubbleLeft + (e.clientX - startX);
    var newTopPx = startBubbleTop + (e.clientY - startY);

    var leftPct = (newLeftPx / cw) * 100;
    var topPct = (newTopPx / ch) * 100;

    var s = E.data.slides[E.idx];
    var usesBottom = s.textPos.bottom && !s.textPos.top;

    bubble.style.left = leftPct + '%';
    if (usesBottom) {
      var bubbleH = bubble.getBoundingClientRect().height;
      var bottomPct = 100 - topPct - (bubbleH / ch) * 100;
      bubble.style.top = '';
      bubble.style.bottom = bottomPct + '%';
      updateBubbleFields(leftPct, null, bottomPct);
    } else {
      bubble.style.bottom = '';
      bubble.style.top = topPct + '%';
      updateBubbleFields(leftPct, topPct, null);
    }
  });

  document.addEventListener('mouseup', function() {
    if (!dragging) return;
    dragging = false;
    bubble.classList.remove('dragging');

    // Save to data
    var s = E.data.slides[E.idx];
    if (!s || !s.textPos) return;

    s.textPos.left = bubble.style.left;
    if (bubble.style.top && bubble.style.top !== '') {
      s.textPos.top = bubble.style.top;
      delete s.textPos.bottom;
    }
    if (bubble.style.bottom && bubble.style.bottom !== '') {
      s.textPos.bottom = bubble.style.bottom;
      delete s.textPos.top;
    }

    markModified();
  });
})();

// Nudge bubble by percentage
function nudgeBubble(dLeft, dTop) {
  var s = E.data && E.data.slides[E.idx];
  if (!s || !s.textPos) return;

  // Parse current position
  var left = parseFloat(s.textPos.left) || 0;
  var usesBottom = s.textPos.bottom && !s.textPos.top;

  left += dLeft;
  s.textPos.left = left + '%';

  if (usesBottom) {
    var bottom = parseFloat(s.textPos.bottom) || 0;
    bottom -= dTop; // dTop positive = move down = decrease bottom
    s.textPos.bottom = bottom + '%';
    updateBubbleFields(left, null, bottom);
  } else {
    var top = parseFloat(s.textPos.top) || 0;
    top += dTop;
    s.textPos.top = top + '%';
    updateBubbleFields(left, top, null);
  }

  renderBubble(s);
  markModified();
}

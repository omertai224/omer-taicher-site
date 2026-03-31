/* ═══ Navigation ═══ */

function goNext() {
  if (!E.data) return;
  if (E.idx < E.data.slides.length - 1) showSlide(E.idx + 1);
}

function goPrev() {
  if (!E.data) return;
  if (E.idx > 0) showSlide(E.idx - 1);
}

function goTo(idx) {
  if (!E.data || idx < 0 || idx >= E.data.slides.length) return;
  showSlide(idx);
}

// Build bottom slide strip
function buildStrip() {
  var strip = $('slideStrip');
  strip.innerHTML = '';
  if (!E.data) return;
  // Grid: stretch dots across full width
  var cols = E.data.slides.length;
  strip.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  var stepCounter = 0;
  E.data.slides.forEach(function(s, i) {
    var dot = document.createElement('div');
    dot.className = 'strip-dot';
    if (s.type === 'intro' || s.type === 'outro' || s.type === 'special' || s.html) {
      dot.classList.add('special');
      dot.textContent = s.type === 'intro' || (s.specialType === 'intro') ? '🏠' :
                         s.type === 'outro' ? '💡' :
                         s.specialType === 'howto' ? '▶' :
                         s.specialType === 'download' ? '⬇' :
                         s.specialType === 'finish' ? '💡' : '◆';
    } else {
      stepCounter++;
      dot.textContent = stepCounter;
    }
    dot.title = 'שקף ' + (i + 1) + (s.step ? ' (צעד ' + s.step + ')' : '');
    dot.onclick = function() { goTo(i); };
    // Drag to reorder - only for step slides (not special)
    var isStep = !(s.type === 'intro' || s.type === 'outro' || s.type === 'special' || s.html);
    if (isStep) {
      dot.draggable = true;
      dot.dataset.idx = i;
      dot.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', this.dataset.idx);
        this.classList.add('dragging-dot');
      });
      dot.addEventListener('dragend', function() { this.classList.remove('dragging-dot'); });
      dot.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-target'); });
      dot.addEventListener('dragleave', function() { this.classList.remove('drop-target'); });
      dot.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drop-target');
        var from = parseInt(e.dataTransfer.getData('text/plain'));
        var to = parseInt(this.dataset.idx);
        if (isNaN(from) || isNaN(to) || from === to) return;
        // Only allow dropping on step slides
        var targetSlide = E.data.slides[to];
        if (targetSlide.type === 'special' || targetSlide.type === 'intro' || targetSlide.html) return;
        var slide = E.data.slides.splice(from, 1)[0];
        E.data.slides.splice(to, 0, slide);
        reindexSlides();
        E.idx = to;
        buildStrip();
        showSlide(to);
        toast('שקף הוזז');
      });
    }
    strip.appendChild(dot);
  });
  updateStrip();
}

// Update strip highlighting
function updateStrip() {
  var dots = $('slideStrip').children;
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i === E.idx);
    dots[i].classList.toggle('modified', !!E.modified[i]);
  }
}

// Update top bar info — show step/totalSteps (not slide index)
function updateInfo() {
  var s = E.data.slides[E.idx];
  var info = '';
  if (s.step) {
    var totalSteps = E.data.totalSteps || countSteps();
    info = 'צעד ' + s.step + '/' + totalSteps;
  } else {
    info = (s.type || s.specialType || 'מיוחד');
  }
  if (E.modified[E.idx]) info += ' *';
  $('slideInfo').textContent = info;
}

// Count total step slides (not special)
function countSteps() {
  var n = 0;
  E.data.slides.forEach(function(s) { if (s.step) n++; });
  return n;
}

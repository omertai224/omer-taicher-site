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

  E.data.slides.forEach(function(s, i) {
    var dot = document.createElement('div');
    dot.className = 'strip-dot';
    if (s.type === 'intro' || s.type === 'outro' || s.type === 'special' || s.html) {
      dot.classList.add('special');
      dot.textContent = s.type === 'intro' || (s.specialType === 'intro') ? '🏠' :
                         s.type === 'outro' ? '💡' :
                         s.specialType === 'howto' ? '▶' :
                         s.specialType === 'download' ? '⬇' : '◆';
    } else {
      dot.textContent = s.step || (i + 1);
    }
    dot.title = 'שקף ' + (i + 1) + (s.step ? ' (צעד ' + s.step + ')' : '');
    dot.onclick = function() { goTo(i); };
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

// Update top bar info
function updateInfo() {
  var s = E.data.slides[E.idx];
  var total = E.data.slides.length;
  var info = (E.idx + 1) + '/' + total;
  if (s.step) info += '  Step ' + s.step;
  info += '  [' + (s.type || 'html') + ']';
  if (E.modified[E.idx]) info += ' *';
  $('slideInfo').textContent = info;
}

/* ═══ Slide Management: add, delete, move, reindex, drag-drop ═══ */

// Reindex all slides (fix index + step numbers)
function reindexSlides() {
  var step = 0;
  for (var i = 0; i < E.data.slides.length; i++) {
    E.data.slides[i].index = i;
    if (E.data.slides[i].type !== 'special') {
      step++;
      E.data.slides[i].step = step;
    }
  }
  E.data.totalSteps = step;
}

// Add slide after current
function addSlideAfterCurrent() {
  if (!E.data) return;
  var newSlide = {
    index: 0,
    type: 'click',
    image: '',
    box: { top: '40%', left: '40%', right: '40%', bottom: '40%' },
    textPos: { left: '20%', top: '30%' },
    step: 0,
    text: '',
    textWidth: '280px'
  };
  E.data.slides.splice(E.idx + 1, 0, newSlide);
  reindexSlides();
  buildStrip();
  showSlide(E.idx + 1);
  toast('שקף חדש נוסף');
}

// Delete current slide
function deleteCurrentSlide() {
  if (!E.data || E.data.slides.length <= 1) return;
  if (!confirm('למחוק את שקף ' + (E.idx + 1) + '?')) return;
  E.data.slides.splice(E.idx, 1);
  reindexSlides();
  if (E.idx >= E.data.slides.length) E.idx = E.data.slides.length - 1;
  buildStrip();
  showSlide(E.idx);
  toast('שקף נמחק');
}

// Move slide forward or backward
function moveSlide(direction) {
  if (!E.data) return;
  var from = E.idx;
  var to = from + direction;
  if (to < 0 || to >= E.data.slides.length) return;
  var temp = E.data.slides[from];
  E.data.slides[from] = E.data.slides[to];
  E.data.slides[to] = temp;
  reindexSlides();
  E.idx = to;
  buildStrip();
  showSlide(to);
}

// Drag & drop images onto canvas to add slides
(function() {
  var canvasArea = document.getElementById('canvasArea');
  var dropOverlay = document.getElementById('dropOverlay');
  var dragCounter = 0;

  canvasArea.addEventListener('dragenter', function(e) {
    e.preventDefault();
    if (!E.data) return;
    dragCounter++;
    dropOverlay.style.display = 'flex';
  });
  canvasArea.addEventListener('dragover', function(e) { e.preventDefault(); });
  canvasArea.addEventListener('dragleave', function(e) {
    dragCounter--;
    if (dragCounter <= 0) { dropOverlay.style.display = 'none'; dragCounter = 0; }
  });
  canvasArea.addEventListener('drop', function(e) {
    e.preventDefault();
    dropOverlay.style.display = 'none';
    dragCounter = 0;
    if (!E.data || !e.dataTransfer.files) return;

    var files = e.dataTransfer.files;
    var added = 0;
    var insertAt = E.idx + 1;

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(f.name)) continue;
      E.imageMap[f.name] = URL.createObjectURL(f);
      var newSlide = {
        index: 0,
        type: 'click',
        image: f.name,
        box: { top: '40%', left: '40%', right: '40%', bottom: '40%' },
        textPos: { left: '20%', top: '30%' },
        step: 0,
        text: '',
        textWidth: '280px'
      };
      E.data.slides.splice(insertAt + added, 0, newSlide);
      added++;
    }

    if (added > 0) {
      reindexSlides();
      buildStrip();
      showSlide(insertAt);
      toast(added + ' שקפים נוספו');
    }
  });
})();

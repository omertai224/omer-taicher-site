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

    var files = [];
    for (var i = 0; i < e.dataTransfer.files.length; i++) {
      var f = e.dataTransfer.files[i];
      if (/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(f.name)) files.push(f);
    }
    if (files.length === 0) return;

    // Sort by name (01, 02, 03...)
    files.sort(function(a, b) { return a.name.localeCompare(b.name, undefined, {numeric: true}); });

    // Rename to [tutorial]-01.png format
    var prefix = E.name.replace(/\//g, '-');
    var existingCount = E.data.slides.filter(function(s) { return s.image; }).length;

    toast('מעלה ' + files.length + ' תמונות...');
    var insertAt = E.idx + 1;

    uploadImagesSequentially(files, prefix, existingCount, insertAt, 0);
  });

  // Upload images one by one to GitHub
  function uploadImagesSequentially(files, prefix, startNum, insertAt, fileIdx) {
    if (fileIdx >= files.length) {
      reindexSlides();
      buildStrip();
      showSlide(insertAt);
      toast(files.length + ' תמונות הועלו ונוספו');
      return;
    }

    var f = files[fileIdx];
    var newName = f.name; // Keep original filename

    var reader = new FileReader();
    reader.onload = function() {
      // Create blob URL for immediate display
      E.imageMap[newName] = URL.createObjectURL(f);

      // Create slide
      var newSlide = {
        index: 0,
        type: 'click',
        image: newName,
        box: { top: '40%', left: '40%', right: '40%', bottom: '40%' },
        textPos: { left: '20%', top: '30%' },
        step: 0,
        text: '',
        textWidth: '280px'
      };
      E.data.slides.splice(insertAt + fileIdx, 0, newSlide);

      // Upload to GitHub if token available
      if (typeof GH !== 'undefined' && GH.token) {
        var base64 = reader.result.split(',')[1];
        var path = 'interactive/tutorials/' + E.name + '/images/' + newName;
        var apiBase = 'https://api.github.com/repos/' + GH.user + '/' + GH.repo;

        ghFetch(apiBase + '/contents/' + path + '?ref=' + GH.branch)
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(existing) {
            var body = {
              message: 'editor: upload ' + newName,
              content: base64,
              branch: GH.branch
            };
            if (existing && existing.sha) body.sha = existing.sha;
            return ghFetch(apiBase + '/contents/' + path, {
              method: 'PUT',
              body: JSON.stringify(body)
            });
          })
          .then(function() {
            toast('הועלה ' + (fileIdx + 1) + '/' + files.length + ': ' + newName);
            uploadImagesSequentially(files, prefix, startNum, insertAt, fileIdx + 1);
          })
          .catch(function(err) {
            toast('שגיאה בהעלאת ' + newName + ': ' + err.message);
            uploadImagesSequentially(files, prefix, startNum, insertAt, fileIdx + 1);
          });
      } else {
        uploadImagesSequentially(files, prefix, startNum, insertAt, fileIdx + 1);
      }
    };
    reader.readAsDataURL(f);
  }
})();

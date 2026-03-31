/* ═══ New Tutorial — Create from scratch ═══ */

(function() {
  var dialog = document.getElementById('newTutorialDialog');
  var btnNew = document.getElementById('btnNewTutorial');
  var btnCancel = document.getElementById('btnCancelNew');
  var btnCreate = document.getElementById('btnCreateNew');
  var uploadZone = document.getElementById('uploadZone');
  var uploadInput = document.getElementById('uploadInput');
  var uploadPreview = document.getElementById('uploadPreview');
  var pendingImages = []; // { file: File, name: string, url: string }

  // ── Type card selection ──
  document.querySelectorAll('.type-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.type-card').forEach(function(c) { c.classList.remove('selected'); });
      card.classList.add('selected');
      card.querySelector('input').checked = true;
    });
  });

  // ── Open / Close dialog ──
  btnNew.addEventListener('click', function() {
    dialog.style.display = 'flex';
    pendingImages = [];
    uploadPreview.innerHTML = '';
    document.getElementById('newTutName').value = '';
    document.getElementById('newTutTitle').value = '';
    document.getElementById('newTutName').focus();
  });

  btnCancel.addEventListener('click', function() {
    dialog.style.display = 'none';
    cleanupPending();
  });

  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) {
      dialog.style.display = 'none';
      cleanupPending();
    }
  });

  // ── Upload zone ──
  uploadZone.addEventListener('click', function() { uploadInput.click(); });

  uploadInput.addEventListener('change', function() {
    if (this.files) addImages(this.files);
    this.value = '';
  });

  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', function() {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  });

  function addImages(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (!/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(f.name)) continue;
      pendingImages.push({ file: f, name: f.name, url: URL.createObjectURL(f) });
    }
    // Sort by name
    pendingImages.sort(function(a, b) { return a.name.localeCompare(b.name); });
    renderPreview();
  }

  function renderPreview() {
    uploadPreview.innerHTML = '';
    if (pendingImages.length === 0) return;
    pendingImages.forEach(function(img) {
      var thumb = document.createElement('img');
      thumb.src = img.url;
      thumb.className = 'upload-thumb';
      thumb.title = img.name;
      uploadPreview.appendChild(thumb);
    });
    var count = document.createElement('div');
    count.className = 'upload-count';
    count.textContent = pendingImages.length + ' תמונות נבחרו';
    uploadPreview.appendChild(count);
  }

  function cleanupPending() {
    pendingImages.forEach(function(img) { URL.revokeObjectURL(img.url); });
    pendingImages = [];
  }

  // ── Create tutorial ──
  btnCreate.addEventListener('click', function() {
    var name = document.getElementById('newTutName').value.trim();
    var title = document.getElementById('newTutTitle').value.trim();
    var type = document.querySelector('input[name="tutType"]:checked').value;

    if (!name) { toast('חסר שם הדרכה'); return; }
    if (!/^[A-Za-z0-9_-]+$/.test(name)) { toast('שם ההדרכה באנגלית בלבד, בלי רווחים'); return; }
    if (!title) { toast('חסרה כותרת בעברית'); return; }

    var data = buildSkeleton(name, title, type, pendingImages);

    // Set editor state
    E.name = name;
    E.path = '';
    E.imageMap = {};
    E.modified = {};

    // Create blob URLs for images
    pendingImages.forEach(function(img) {
      E.imageMap[img.name] = img.url;
    });

    // Load into editor
    onDataLoaded(data);

    // Close dialog
    dialog.style.display = 'none';
    toast('הדרכה חדשה: ' + name + ' (' + data.slides.length + ' שקפים)');
  });

  // ── Build skeleton slides.json ──
  function buildSkeleton(name, title, type, images) {
    var slides = [];
    var idx = 0;

    // ── Intro slide ──
    slides.push({
      index: idx++,
      type: 'special',
      specialType: 'intro',
      html: buildIntroHtml(title)
    });

    // ── Navigation video slide ──
    slides.push({
      index: idx++,
      type: 'special',
      specialType: 'howto',
      html: buildHowtoHtml()
    });

    // ── "Meet X" slide ──
    slides.push({
      index: idx++,
      type: 'special',
      specialType: 'meet',
      html: buildMeetHtml(title)
    });

    if (type === 'download') {
      // ── Download slide ──
      slides.push({
        index: idx++,
        type: 'special',
        specialType: 'download',
        html: buildDownloadHtml(title)
      });
    }

    // ── Step slides from images ──
    var step = 0;
    images.forEach(function(img) {
      step++;
      slides.push({
        index: idx++,
        type: 'click',
        image: img.name,
        box: { top: '40%', left: '40%', right: '40%', bottom: '40%' },
        textPos: { left: '20%', top: '30%' },
        step: step,
        text: 'צעד ' + step,
        textWidth: '280px'
      });
    });

    // ── Finish slide ──
    slides.push({
      index: idx++,
      type: 'special',
      specialType: 'finish',
      html: buildFinishHtml(title)
    });

    var totalSteps = step;

    return {
      tutorial: title,
      totalSteps: totalSteps,
      slides: slides
    };
  }

  // ── HTML builders for special slides ──
  function buildIntroHtml(title) {
    return '<div style="min-height:calc(100vh - 80px);background:linear-gradient(135deg,#0f1a2e,#1a2540);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:Rubik,sans-serif;">' +
      '<div style="font-size:42px;font-weight:900;color:white;margin-bottom:16px;">' + title + '</div>' +
      '<div style="font-size:18px;color:#ffffffaa;margin-bottom:32px;">תיאור ההדרכה</div>' +
      '<button onclick="nextSlide()" style="background:linear-gradient(135deg,#e8834e,#f6a67e);border:none;color:#1a1a2e;padding:16px 40px;border-radius:14px;font-size:18px;font-weight:700;cursor:pointer;font-family:Rubik,sans-serif;">בואו נתחיל</button>' +
    '</div>';
  }

  function buildHowtoHtml() {
    return '<div style="min-height:calc(100vh - 80px);background:linear-gradient(135deg,#0f1a2e,#1a2540);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:Rubik,sans-serif;">' +
      '<div style="font-size:28px;font-weight:700;color:white;margin-bottom:24px;">איך עובדים עם ההדרכה?</div>' +
      '<div style="font-size:16px;color:#ffffffaa;margin-bottom:20px;line-height:1.8;">צפו בסרטון הקצר</div>' +
      '<button onclick="nextSlide()" style="background:#1e5f74;border:2px solid #5b8fa8;color:white;padding:14px 36px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;font-family:Rubik,sans-serif;">הבנתי, קדימה</button>' +
    '</div>';
  }

  function buildMeetHtml(title) {
    return '<div style="min-height:calc(100vh - 80px);background:linear-gradient(135deg,#0f1a2e,#1a2540);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:Rubik,sans-serif;">' +
      '<div style="font-size:28px;font-weight:700;color:white;margin-bottom:16px;">הכירו את ' + title + '</div>' +
      '<div style="font-size:16px;color:#ffffffaa;margin-bottom:24px;">placeholder לסרטון הסבר</div>' +
      '<button onclick="nextSlide()" style="background:#1e5f74;border:2px solid #5b8fa8;color:white;padding:14px 36px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;font-family:Rubik,sans-serif;">המשך</button>' +
    '</div>';
  }

  function buildDownloadHtml(title) {
    return '<div style="min-height:calc(100vh - 80px);background:linear-gradient(135deg,#0f1a2e,#1a2540);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:Rubik,sans-serif;">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2" style="margin-bottom:16px;"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
      '<div style="font-size:28px;font-weight:700;color:white;margin-bottom:16px;">הורידו את ' + title + '</div>' +
      '<div style="font-size:16px;color:#ffffffaa;margin-bottom:24px;">לחצו על הכפתור להורדת התוכנה</div>' +
      '<a href="#" onclick="nextSlide();return false;" style="display:inline-block;background:#1e5f74;border:2px solid #5b8fa8;color:white;padding:14px 36px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;font-family:Rubik,sans-serif;text-decoration:none;">הורידו (קישור)</a>' +
    '</div>';
  }

  function buildFinishHtml(title) {
    return '<div style="min-height:calc(100vh - 80px);background:linear-gradient(135deg,#0f1a2e,#1a2540);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px;font-family:Rubik,sans-serif;">' +
      '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2" style="margin-bottom:16px;"><path d="M9 18l6-6-6-6"/></svg>' +
      '<div style="font-size:28px;font-weight:700;color:white;margin-bottom:16px;">כל הכבוד!</div>' +
      '<div style="font-size:16px;color:#ffffffaa;line-height:1.8;">סיימתם את ההדרכה של ' + title + '</div>' +
    '</div>';
  }

  // ── Drag & drop images onto canvas ──
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
    var insertAt = E.idx + 1; // Insert after current slide

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!/\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(f.name)) continue;

      // Create blob URL
      E.imageMap[f.name] = URL.createObjectURL(f);

      // Create new slide
      var newSlide = {
        index: 0, // Will be recalculated
        type: 'click',
        image: f.name,
        box: { top: '40%', left: '40%', right: '40%', bottom: '40%' },
        textPos: { left: '20%', top: '30%' },
        step: 0, // Will be recalculated
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

  // ── Reindex all slides (fix index + step numbers) ──
  window.reindexSlides = function() {
    var step = 0;
    for (var i = 0; i < E.data.slides.length; i++) {
      E.data.slides[i].index = i;
      if (E.data.slides[i].type !== 'special') {
        step++;
        E.data.slides[i].step = step;
      }
    }
    E.data.totalSteps = step;
  };

  // ── Add slide after current ──
  window.addSlideAfterCurrent = function() {
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
  };

  // ── Delete current slide ──
  window.deleteCurrentSlide = function() {
    if (!E.data || E.data.slides.length <= 1) return;
    if (!confirm('למחוק את שקף ' + (E.idx + 1) + '?')) return;
    E.data.slides.splice(E.idx, 1);
    reindexSlides();
    if (E.idx >= E.data.slides.length) E.idx = E.data.slides.length - 1;
    buildStrip();
    showSlide(E.idx);
    toast('שקף נמחק');
  };

  // ── Move slide ──
  window.moveSlide = function(direction) {
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
  };
})();

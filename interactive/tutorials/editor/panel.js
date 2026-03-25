/* ═══ Side Panel — Minimal ═══ */

function buildPanel() {
  var arrowSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">';
  var arrL = arrowSvg + '<polyline points="19 12 5 12"/><polyline points="12 19 5 12 12 5"/></svg>';
  var arrR = arrowSvg + '<polyline points="5 12 19 12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var arrU = arrowSvg + '<polyline points="12 19 12 5"/><polyline points="5 12 12 5 19 12"/></svg>';
  var arrD = arrowSvg + '<polyline points="12 5 12 19"/><polyline points="19 12 12 19 5 12"/></svg>';

  $('panel').innerHTML = ''
    // ── Slide Info ──
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> שקף <span id="pInfo" style="color:#ffffff77;font-weight:400;font-size:10px;"></span></h3>'
    + '<div class="type-btns">'
    + '<div class="type-btn" data-type="click" onclick="setSlideType(\'click\')" title="שקף עם לחיצה על המסגרת הכתומה">לחיצה</div>'
    + '<div class="type-btn" data-type="view" onclick="setSlideType(\'view\')" title="שקף צפייה בלבד, כפתור המשך">צפייה</div>'
    + '</div>'

    // ── Box ──
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> מסגרת כתומה</h3>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBox(-1,0)">' + arrL + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,-1)">' + arrU + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,1)">' + arrD + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(1,0)">' + arrR + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(-0.2,0)" title="עדין">' + arrL + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0,-0.2)" title="עדין">' + arrU + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0,0.2)" title="עדין">' + arrD + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0.2,0)" title="עדין">' + arrR + '</div>'
    + '</div>'

    // ── Bubble ──
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> בועת טקסט</h3>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBubble(-1,0)">' + arrL + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,-1)">' + arrU + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,1)">' + arrD + '</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(1,0)">' + arrR + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(-0.2,0)" title="עדין">' + arrL + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0,-0.2)" title="עדין">' + arrU + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0,0.2)" title="עדין">' + arrD + '</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0.2,0)" title="עדין">' + arrR + '</div>'
    + '</div>'

    // ── Text ──
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> טקסט</h3>'
    + '<div id="pText" class="text-editor" contenteditable="true" oninput="applyText()"></div>'

    // ── Actions ──
    + '<div class="action-btns">'
    + '<div class="action-btn undo" onclick="undo()" id="btnUndo" title="Ctrl+Z"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-8.36L1 10"/></svg> ביטול</div>'
    + '<div class="action-btn reset" onclick="resetSlide()">אפס שקף</div>'
    + '</div>';
}

// ── Update panel from slide data ──
function updatePanel(s) {
  $('pInfo').textContent = '#' + s.index + (s.step ? ' (צעד ' + s.step + ')' : '') + ' [' + (s.type || 'html') + ']';

  var btns = document.querySelectorAll('.type-btn[data-type]');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.type === s.type);
  }

  $('pText').innerHTML = s.text || '';
  updateUndoBtn();
}

// ── Apply from panel ──
function applyText() {
  var s = E.data.slides[E.idx];
  s.text = $('pText').innerHTML;
  $('bubblePreview').innerHTML = s.text;
  markModified();
}

function setSlideType(type) {
  saveUndo();
  var s = E.data.slides[E.idx];
  s.type = type;
  var btns = document.querySelectorAll('.type-btn[data-type]');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.type === type);
  }
  markModified();
}

function resetSlide() {
  if (!E.original) return;
  E.data.slides[E.idx] = JSON.parse(JSON.stringify(E.original.slides[E.idx]));
  delete E.modified[E.idx];
  E.history[E.idx] = [];
  showSlide(E.idx);
  toast('השקף אופס');
}

// ── Undo System ──
if (!E.history) E.history = {};

function saveUndo() {
  var idx = E.idx;
  if (!E.history[idx]) E.history[idx] = [];
  E.history[idx].push(JSON.stringify(E.data.slides[idx]));
  if (E.history[idx].length > 30) E.history[idx].shift();
  updateUndoBtn();
}

function undo() {
  var idx = E.idx;
  if (!E.history[idx] || E.history[idx].length === 0) {
    toast('אין מה לבטל');
    return;
  }
  E.data.slides[idx] = JSON.parse(E.history[idx].pop());
  showSlide(idx);
  toast('בוטל');
}

function updateUndoBtn() {
  var btn = $('btnUndo');
  if (!btn) return;
  var has = E.history[E.idx] && E.history[E.idx].length > 0;
  btn.style.opacity = has ? '1' : '0.3';
}

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.key === 'z') {
    var tag = e.target.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    e.preventDefault();
    undo();
  }
});

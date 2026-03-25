/* ═══ Side Panel — Minimal ═══ */

function buildPanel() {
  $('panel').innerHTML = ''
    // ── Slide Info ──
    + '<h3>שקף <span id="pInfo" style="color:#ffffffaa;font-weight:400;"></span></h3>'
    + '<div class="type-btns">'
    + '<div class="type-btn" data-type="click" onclick="setSlideType(\'click\')">click</div>'
    + '<div class="type-btn" data-type="view" onclick="setSlideType(\'view\')">view</div>'
    + '<div class="type-btn" data-type="right-click" onclick="setSlideType(\'right-click\')">R-click</div>'
    + '<div class="type-btn" data-type="double-click" onclick="setSlideType(\'double-click\')">dbl</div>'
    + '</div>'

    // ── Box ──
    + '<h3>מסגרת כתומה</h3>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBox(-1,0)">&larr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,-1)">&uarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,1)">&darr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(1,0)">&rarr;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(-0.2,0)" title="עדין">&lsaquo;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0,-0.2)" title="עדין">&#x2303;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0,0.2)" title="עדין">&#x2304;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBox(0.2,0)" title="עדין">&rsaquo;</div>'
    + '</div>'

    // ── Bubble ──
    + '<h3>בועת טקסט</h3>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBubble(-1,0)">&larr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,-1)">&uarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,1)">&darr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(1,0)">&rarr;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(-0.2,0)" title="עדין">&lsaquo;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0,-0.2)" title="עדין">&#x2303;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0,0.2)" title="עדין">&#x2304;</div>'
    + '<div class="nudge-btn sm" onclick="nudgeBubble(0.2,0)" title="עדין">&rsaquo;</div>'
    + '</div>'

    // ── Text ──
    + '<h3>טקסט</h3>'
    + '<textarea id="pText" oninput="applyText()"></textarea>'

    // ── Actions ──
    + '<div class="action-btns">'
    + '<div class="action-btn undo" onclick="undo()" id="btnUndo" title="Ctrl+Z">&#x21A9; ביטול</div>'
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

  $('pArrow').value = s.arrow || 'none';
  $('pText').value = s.text || '';
  updateUndoBtn();
}

// ── Apply from panel ──
function applyArrow() {
  saveUndo();
  var s = E.data.slides[E.idx];
  var v = $('pArrow').value;
  s.arrow = (v === 'none') ? '' : v;
  markModified();
}

function applyText() {
  var s = E.data.slides[E.idx];
  s.text = $('pText').value;
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

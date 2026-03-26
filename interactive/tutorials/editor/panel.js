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
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> מסגרת כתומה <span class="orange-btn" onclick="addBox()" title="הוסף מסגרת">+ הוסף</span> <span class="orange-btn" onclick="removeBox()" title="הסר מסגרת" style="color:#ff6b6b;border-color:#ff6b6b55;">- הסר</span></h3>'
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
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> בועת טקסט <span class="orange-btn" onclick="addBubble()" title="הוסף בועה">+ הוסף</span> <span class="orange-btn" onclick="removeBubble()" title="הסר בועה" style="color:#ff6b6b;border-color:#ff6b6b55;">- הסר</span></h3>'
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
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> טקסט <span class="orange-btn" onmousedown="event.preventDefault()" onclick="toggleOrange()" title="סמנו מילים ולחצו להדגשה בכתום">&#x25CF; כתום</span> <span class="orange-btn" onmousedown="event.preventDefault()" onclick="toggleWhite()" title="סמנו מילים ולחצו להפיכה ללבן" style="color:#ffffffcc;border-color:#ffffff44;">&#x25CF; לבן</span> <span class="orange-btn" onclick="insertLineBreak()" title="שורה חדשה" style="color:#5b8fa8;border-color:#5b8fa855;">&#x23CE; שורה</span> <span class="mic-btn" onclick="toggleSpeech(\'text\')" title="הקלטה לטקסט"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></span></h3>'
    + '<div id="pText" class="text-editor" contenteditable="true" oninput="applyText()"></div>'
    + '<div style="margin-top:6px;"><span class="orange-btn" onclick="toggleContinueBtn()" id="btnContinue" title="הוסף/הסר כפתור המשך לשקפי צפייה" style="color:#5b8fa8;border-color:#5b8fa855;">▶ כפתור המשך</span></div>'

    // ── Notes ──
    + '<h3><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> הערות <span class="orange-btn" onclick="addNote()" style="color:#fbbf24;border-color:#fbbf2455;">+ הערה</span></h3>'
    + '<div id="notesList"></div>'

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
  updateContinueBtn(s);
  updateUndoBtn();
  renderNotes(s);
}

// ── Continue button (כפתור המשך) ──
function updateContinueBtn(s) {
  var btn = $('btnContinue');
  if (!btn) return;
  var has = hasContinueBtn(s);
  btn.textContent = has ? '✓ כפתור המשך' : '▶ כפתור המשך';
  btn.style.color = has ? '#4ade80' : '#5b8fa8';
  btn.style.borderColor = has ? '#4ade8055' : '#5b8fa855';
}

var CONTINUE_MARKER = 'כדי להמשיך בהדרכה.';
var CONTINUE_HTML = '<div style="text-align:center;margin-top:12px;">לחצו על <span onclick="nextSlide()" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:linear-gradient(135deg,#1a2540,#3d5a80);border:2px solid white;border-radius:50%;cursor:pointer;vertical-align:middle;margin:0 6px;box-shadow:0 4px 12px rgba(26,37,64,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span> כדי להמשיך בהדרכה.</div>';

function hasContinueBtn(s) {
  return s.text && s.text.indexOf(CONTINUE_MARKER) > -1;
}

function toggleContinueBtn() {
  var s = E.data.slides[E.idx];
  saveUndo();
  if (hasContinueBtn(s)) {
    // הסרה — מוחק את ה-div עם הכפתור
    s.text = s.text.replace(/<div style="text-align:center;margin-top:12px;">.*?כדי להמשיך בהדרכה\..*?<\/div>/g, '').trim();
    toast('כפתור המשך הוסר');
  } else {
    // הוספה — מוסיף בסוף הטקסט
    s.text = (s.text || '') + CONTINUE_HTML;
    toast('כפתור המשך נוסף');
  }
  $('pText').innerHTML = s.text;
  updateContinueBtn(s);
  renderBubble(s);
  markModified();
}

// ── Toggle orange highlight on selected text ──
function toggleOrange() {
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    toast('סמנו מילים קודם');
    return;
  }
  saveUndo();
  var range = sel.getRangeAt(0);
  var parent = range.commonAncestorContainer;

  // Check if already inside an orange span
  var orangeParent = null;
  var node = parent;
  while (node && node !== $('pText')) {
    if (node.nodeType === 1 && node.style && node.style.color === 'rgb(246, 166, 126)') {
      orangeParent = node;
      break;
    }
    node = node.parentNode;
  }

  if (orangeParent) {
    // Remove orange: unwrap span but keep inner HTML (including <br> tags)
    while (orangeParent.firstChild) {
      orangeParent.parentNode.insertBefore(orangeParent.firstChild, orangeParent);
    }
    orangeParent.parentNode.removeChild(orangeParent);
  } else {
    // Add orange: wrap selection in span (safe even across elements)
    var span = document.createElement('span');
    span.style.color = '#f6a67e';
    try {
      range.surroundContents(span);
    } catch (e) {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
  }
  sel.removeAllRanges();
  applyText();
}

// ── Toggle white on selected text (remove orange or force white) ──
function toggleWhite() {
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    toast('סמנו מילים קודם');
    return;
  }
  saveUndo();
  var range = sel.getRangeAt(0);
  var parent = range.commonAncestorContainer;

  // Check if inside a colored span (orange or any other)
  var colorParent = null;
  var node = parent;
  while (node && node !== $('pText')) {
    if (node.nodeType === 1 && node.style && node.style.color && node.style.color !== '') {
      colorParent = node;
      break;
    }
    node = node.parentNode;
  }

  if (colorParent) {
    // Remove the color span: unwrap and keep inner HTML
    while (colorParent.firstChild) {
      colorParent.parentNode.insertBefore(colorParent.firstChild, colorParent);
    }
    colorParent.parentNode.removeChild(colorParent);
  }
  // No need to wrap in a white span — the default bubble text color is already white (#ffffffcc)
  sel.removeAllRanges();
  applyText();
}

// ── Line break: insert <br> at cursor ──
function insertLineBreak() {
  var editor = $('pText');
  editor.focus();
  document.execCommand('insertHTML', false, '<br>');
  applyText();
}

// Enter key in text editor = <br> not <div>
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var editor = document.getElementById('pText');
    if (editor) {
      editor.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.execCommand('insertHTML', false, '<br>');
          applyText();
        }
      });
    }
  }, 500);
});

// ── Apply from panel ──
function applyText() {
  var s = E.data.slides[E.idx];
  s.text = $('pText').innerHTML;
  renderBubble(s);
  markModified();
}

// ── Add/Remove box ──
function addBox() {
  var s = E.data.slides[E.idx];
  if (s.box) { toast('כבר יש מסגרת'); return; }
  saveUndo();
  s.box = { top: '30%', left: '30%', right: '50%', bottom: '50%' };
  renderBox(s);
  markModified();
  toast('מסגרת נוספה. גררו למיקום הנכון');
}

function removeBox() {
  var s = E.data.slides[E.idx];
  if (!s.box) { toast('אין מסגרת להסרה'); return; }
  saveUndo();
  delete s.box;
  $('editorBox').style.display = 'none';
  markModified();
  toast('מסגרת הוסרה');
}

// ── Add/Remove bubble ──
function addBubble() {
  var s = E.data.slides[E.idx];
  if (s.textPos && s.text) { toast('כבר יש בועה'); return; }
  saveUndo();
  s.textPos = { left: '10%', top: '10%' };
  s.text = s.text || 'טקסט חדש';
  renderBubble(s);
  $('pText').innerHTML = s.text;
  markModified();
  toast('בועה נוספה. גררו למיקום הנכון');
}

function removeBubble() {
  var s = E.data.slides[E.idx];
  if (!s.textPos && !s.text) { toast('אין בועה להסרה'); return; }
  saveUndo();
  delete s.textPos;
  delete s.text;
  $('editorBubble').style.display = 'none';
  $('pText').innerHTML = '';
  markModified();
  toast('בועה הוסרה');
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

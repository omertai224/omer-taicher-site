/* ═══ Side Panel ═══ */

function buildPanel() {
  $('panel').innerHTML = ''
    // ── Slide Info ──
    + '<h3>שקף</h3>'
    + '<div class="row"><div><label>אינדקס</label><input id="pIdx" readonly></div>'
    + '<div><label>צעד</label><input id="pStep" readonly></div></div>'
    + '<label>סוג שקף</label>'
    + '<div class="type-btns">'
    + '<div class="type-btn" data-type="click" onclick="setSlideType(\'click\')">click</div>'
    + '<div class="type-btn" data-type="view" onclick="setSlideType(\'view\')">view</div>'
    + '<div class="type-btn" data-type="right-click" onclick="setSlideType(\'right-click\')">right-click</div>'
    + '<div class="type-btn" data-type="double-click" onclick="setSlideType(\'double-click\')">dbl-click</div>'
    + '</div>'

    // ── Box ──
    + '<h3>מסגרת כתומה</h3>'
    + '<div class="row"><div><label>top</label><input id="pBT" onchange="applyBox()"></div>'
    + '<div><label>bottom</label><input id="pBB" onchange="applyBox()"></div></div>'
    + '<div class="row"><div><label>left</label><input id="pBL" onchange="applyBox()"></div>'
    + '<div><label>right</label><input id="pBR" onchange="applyBox()"></div></div>'
    + '<label>הזז מסגרת</label>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBox(-0.5,0)">&larr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,-0.5)">&uarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,0.5)">&darr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0.5,0)">&rarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(-0.1,0)" style="font-size:9px;">&#x21E0;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,-0.1)" style="font-size:9px;">&#x21E1;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0,0.1)" style="font-size:9px;">&#x21E3;</div>'
    + '<div class="nudge-btn" onclick="nudgeBox(0.1,0)" style="font-size:9px;">&#x21E2;</div>'
    + '</div>'

    // ── Bubble ──
    + '<h3>בועת טקסט</h3>'
    + '<label>כיוון חץ</label>'
    + '<select id="pArrow" onchange="applyArrow()">'
    + '<option value="arrow-right">arrow-right (בועה משמאל)</option>'
    + '<option value="arrow-left">arrow-left (בועה מימין)</option>'
    + '<option value="arrow-bottom-left">arrow-bottom-left (למטה)</option>'
    + '<option value="arrow-top-left">arrow-top-left (למעלה)</option>'
    + '<option value="none">ללא חץ</option>'
    + '</select>'
    + '<div class="row"><div><label>left</label><input id="pTL" onchange="applyBubblePos()"></div>'
    + '<div><label>top</label><input id="pTT" onchange="applyBubblePos()"></div></div>'
    + '<div class="row"><div><label>bottom</label><input id="pTB" onchange="applyBubblePos()"></div><div></div></div>'
    + '<label>הזז בועה</label>'
    + '<div class="nudge-btns">'
    + '<div class="nudge-btn" onclick="nudgeBubble(-0.5,0)">&larr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,-0.5)">&uarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,0.5)">&darr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0.5,0)">&rarr;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(-0.1,0)" style="font-size:9px;">&#x21E0;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,-0.1)" style="font-size:9px;">&#x21E1;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0,0.1)" style="font-size:9px;">&#x21E3;</div>'
    + '<div class="nudge-btn" onclick="nudgeBubble(0.1,0)" style="font-size:9px;">&#x21E2;</div>'
    + '</div>'

    // ── Text ──
    + '<h3>טקסט הבועה (HTML)</h3>'
    + '<textarea id="pText" oninput="applyText()"></textarea>'

    // ── Actions ──
    + '<h3>פעולות</h3>'
    + '<div class="row" style="gap:6px;">'
    + '<div><div class="type-btn" onclick="resetSlide()" style="padding:8px;cursor:pointer;">אפס שקף</div></div>'
    + '<div><div class="type-btn" onclick="downloadJSON()" style="padding:8px;cursor:pointer;background:#1e5f74;color:white;">הורד JSON</div></div>'
    + '</div>'

    // ── Help ──
    + '<h3>עזרה</h3>'
    + '<div style="color:#ffffff44;font-size:10px;line-height:1.8;">'
    + 'חיצים: ניווט שקפים<br>'
    + 'גרירה: בועה / מסגרת<br>'
    + 'פינות: שינוי גודל מסגרת<br>'
    + 'Ctrl+S: הורדת JSON<br>'
    + 'כפתורי הזז: 0.5% (גדול) / 0.1% (קטן)'
    + '</div>';
}

// ── Update panel from slide data ──
function updatePanel(s) {
  $('pIdx').value = s.index;
  $('pStep').value = s.step || '-';

  // Type buttons
  var btns = document.querySelectorAll('.type-btn[data-type]');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.type === s.type);
  }

  // Box
  if (s.box) {
    $('pBT').value = s.box.top || '';
    $('pBB').value = s.box.bottom || '';
    $('pBL').value = s.box.left || '';
    $('pBR').value = s.box.right || '';
  } else {
    $('pBT').value = $('pBB').value = $('pBL').value = $('pBR').value = '';
  }

  // Bubble
  if (s.textPos) {
    $('pTL').value = s.textPos.left || '';
    $('pTT').value = s.textPos.top || '';
    $('pTB').value = s.textPos.bottom || '';
  } else {
    $('pTL').value = $('pTT').value = $('pTB').value = '';
  }

  $('pArrow').value = s.arrow || 'none';
  $('pText').value = s.text || '';
}

// ── Panel → Data helpers ──
function updateBoxFields(t, b, l, r) {
  $('pBT').value = (typeof t === 'number' ? t.toFixed(4) + '%' : t);
  $('pBB').value = (typeof b === 'number' ? b.toFixed(4) + '%' : b);
  $('pBL').value = (typeof l === 'number' ? l.toFixed(4) + '%' : l);
  $('pBR').value = (typeof r === 'number' ? r.toFixed(4) + '%' : r);
}

function updateBubbleFields(l, t, b) {
  $('pTL').value = (typeof l === 'number' ? l.toFixed(2) + '%' : (l || ''));
  $('pTT').value = (typeof t === 'number' ? t.toFixed(2) + '%' : (t || ''));
  $('pTB').value = (typeof b === 'number' ? b.toFixed(2) + '%' : (b || ''));
}

// ── Apply from panel inputs ──
function applyBox() {
  var s = E.data.slides[E.idx];
  if (!s.box) s.box = {};
  s.box.top = $('pBT').value;
  s.box.bottom = $('pBB').value;
  s.box.left = $('pBL').value;
  s.box.right = $('pBR').value;
  renderBox(s);
  markModified();
}

function applyBubblePos() {
  var s = E.data.slides[E.idx];
  if (!s.textPos) s.textPos = {};
  var l = $('pTL').value, t = $('pTT').value, b = $('pTB').value;
  if (l) s.textPos.left = l;
  if (t) { s.textPos.top = t; delete s.textPos.bottom; }
  if (b && !t) { s.textPos.bottom = b; delete s.textPos.top; }
  renderBubble(s);
  markModified();
}

function applyArrow() {
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
  showSlide(E.idx);
  toast('השקף אופס');
}

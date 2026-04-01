/* ═══════════════════════════════════════════════════
   Shared Tutorial Script — כל ההדרכות משתמשות בזה

   כל הדרכה מגדירה לפני טעינת הקובץ הזה:
   - var slideMap = { 0: {icon:'home', title:'...'}, ... };

   נתיב תמונות משותפות (חיצים, לוגו):
   - ../../shared/images/  (כל ההדרכות באותו עומק)
   ═══════════════════════════════════════════════════ */

var slideIndex = 1;
// Auto-detect shared path from the stylesheet link (works at any nesting depth)
var sharedImages = (function() {
  var links = document.querySelectorAll('link[rel="stylesheet"][href*="shared/style.css"]');
  if (links.length) {
    return links[0].getAttribute('href').replace('style.css', 'images');
  }
  return '../../shared/images';
})();

/* ── Navigation ── */
function nextSlide() { showSlides(slideIndex + 1); }
function prevSlide() { showSlides(slideIndex - 1); }
function currentSlide(n) { showSlides(n); }

function showSlides(n) {
  let slides = document.getElementsByClassName("mySlides");
  if (n > slides.length) return;
  if (n < 1) return;
  slideIndex = n;

  let next = document.getElementById("right-arrow");
  let previous = document.getElementById("left-arrow");

  if (n == slides.length) {
    next.style.opacity = "0.3";
    next.style.cursor = "default";
  } else {
    next.style.opacity = "1";
    next.style.cursor = "pointer";
  }
  if (n == 1) {
    previous.style.opacity = "0.3";
    previous.style.cursor = "default";
  } else {
    previous.style.opacity = "1";
    previous.style.cursor = "pointer";
  }

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
  scaleBubbles();
  setNavBarColor(slideIndex);
  updateMagnifierVisibility();
  updateTtsVisibility();
}

/* ── Scale + anchor bubbles to the orange box ── */
/* scaleBubbles(): scales bubble and positions it at the exact angle
   from the box center to where the editor placed it (360 degrees). */
function scaleBubbles() {
  var designW = window.bubbleDesignWidth;
  if (!designW) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;
  function doScale() {
    var w = img.offsetWidth;
    var h = img.offsetHeight;
    if (!w || !h) return;
    var scale = w / designW;
    var designH = designW * h / w;
    var texts = slide.querySelectorAll('.text');
    var highlightEls = slide.querySelectorAll('.image-center > *:not(img):not(.text)');
    var box = highlightEls.length > 0 ? highlightEls[0] : null;
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      t.style.transform = 'scale(' + scale + ')';
      t.style.transformOrigin = 'left top';
      if (!box) continue;
      var bL = parseFloat(box.style.left) || 0;
      var bR = parseFloat(box.style.right) || 0;
      var bT = parseFloat(box.style.top) || 0;
      var bB = parseFloat(box.style.bottom) || 0;
      var bRE = 100 - bR;
      var bBE = 100 - bB;
      var bCX = (bL + bRE) / 2;
      var bCY = (bT + bBE) / 2;
      var twPct = (t.offsetWidth || 300) / designW * 100;
      var thPct = (t.offsetHeight || 150) / designH * 100;
      var gap = 1.5;

      /* Get original textPos angle from box center */
      var tL = parseFloat(t.style.left) || 0;
      var tT = parseFloat(t.style.top) || 0;
      var tCX = tL + twPct / 2;
      var tCY = tT + thPct / 2;
      var angle = Math.atan2(tCY - bCY, tCX - bCX);

      /* Place bubble outside the box at the exact angle, with gap */
      var cosA = Math.cos(angle);
      var sinA = Math.sin(angle);
      var boxW = bRE - bL;
      var boxH = bBE - bT;
      /* Distance from center to box edge in the direction of the angle */
      var edgeDist;
      if (Math.abs(cosA) * boxH > Math.abs(sinA) * boxW) {
        edgeDist = (boxW / 2) / Math.abs(cosA);
      } else {
        edgeDist = (boxH / 2) / Math.abs(sinA);
      }
      /* Anchor = box edge + gap */
      var anchorX = bCX + cosA * (edgeDist + gap);
      var anchorY = bCY + sinA * (edgeDist + gap);
      /* Position bubble so its nearest edge touches the anchor */
      var newL, newT;
      if (cosA >= 0) { newL = anchorX; } else { newL = anchorX - twPct; }
      if (sinA >= 0) { newT = anchorY; } else { newT = anchorY - thPct; }
      /* Clamp to screen bounds */
      newL = Math.max(0.5, Math.min(newL, 99 - twPct));
      newT = Math.max(0.5, Math.min(newT, 98 - thPct));
      t.style.left = newL + '%';
      t.style.top = newT + '%';
    }
  }
  if (img.complete && img.naturalWidth > 0) { doScale(); }
  else { img.addEventListener('load', doScale); }
}
window.addEventListener('resize', function() { scaleBubbles(); });

/* ── Nav Bar Color ── */
function setNavBarColor(n) {
  let dots = document.getElementsByClassName("nav-dot");
  for (let i = 0; i < dots.length; i++) {
    if (i <= n - 1) {
      dots[i].classList.add('active');
    } else {
      dots[i].classList.remove('active');
    }
  }
}

/* ── SVG Icons ── */
var specialIcons = {
  home: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>',
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v10M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>',
  monitor: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  install: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  usage: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 10l3 3 7-7"/></svg>',
  finish: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
  search: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  mic: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><rect x="11" y="9" width="2" height="4.5" rx="1" fill="#1a1a2e"/><circle cx="12" cy="16" r="1" fill="#1a1a2e"/></svg>'
};

/* ── Nav Dots ── */
function buildNavDots() {
  let slides = document.getElementsByClassName("mySlides");
  let container = document.querySelector('.nav-dots');
  if (!container) return;
  if (typeof slideMap === 'undefined') window.slideMap = {};

  var cols = Math.ceil(slides.length / 2);
  container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  var stepNum = 0;
  for (let i = 0; i < slides.length; i++) {
    let dot = document.createElement('button');
    dot.className = 'nav-dot';
    var special = slideMap[i];
    if (special) {
      dot.innerHTML = specialIcons[special.icon] || '';
      dot.title = special.title;
      dot.classList.add('nav-dot-icon');
    } else {
      stepNum++;
      dot.textContent = stepNum.toString();
      dot.title = stepNum.toString();
    }
    (function(index) {
      dot.addEventListener('click', function() { showSlides(index + 1); });
    })(i);
    container.appendChild(dot);
  }
}

/* ── Magnifier ── */
var magnifierActive = false;
var magnifierZoom = 2;
var magnifierLensW = 420;
var magnifierLensH = 300;
var magnifierClone = null;

function initMagnifier() {
  var btn = document.createElement('button');
  btn.className = 'magnifier-btn';
  btn.id = 'magnifier-btn';
  btn.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>';
  btn.title = 'זכוכית מגדלת';
  btn.addEventListener('click', toggleMagnifier);
  document.body.appendChild(btn);

  var lens = document.createElement('div');
  lens.className = 'magnifier-lens';
  lens.id = 'magnifier-lens';
  document.body.appendChild(lens);

  var escHint = document.createElement('div');
  escHint.className = 'magnifier-esc-hint';
  escHint.id = 'magnifier-esc-hint';
  escHint.innerHTML = 'ניתן ללחוץ<br>Esc<br>במקלדת לביטול';
  document.body.appendChild(escHint);
}

function toggleMagnifier() {
  magnifierActive = !magnifierActive;
  var btn = document.getElementById('magnifier-btn');
  var lens = document.getElementById('magnifier-lens');
  var escHint = document.getElementById('magnifier-esc-hint');
  if (magnifierActive) {
    btn.classList.add('active');
    document.body.classList.add('magnifier-active');
    if (escHint) escHint.style.display = 'block';
    positionEscHint();
  } else {
    btn.classList.remove('active');
    lens.style.display = 'none';
    document.body.classList.remove('magnifier-active');
    if (escHint) escHint.style.display = 'none';
    if (magnifierClone) { magnifierClone.remove(); magnifierClone = null; }
  }
}

function positionEscHint() {
  var escHint = document.getElementById('magnifier-esc-hint');
  var btn = document.getElementById('magnifier-btn');
  if (!escHint || !btn) return;
  var btnRect = btn.getBoundingClientRect();
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;
  var imgRect = img.getBoundingClientRect();
  var blackLeft = imgRect.left;
  escHint.style.maxWidth = Math.max(60, blackLeft - 8) + 'px';
  var hintLeft = Math.max(4, blackLeft / 2 - escHint.offsetWidth / 2);
  escHint.style.left = hintLeft + 'px';
  escHint.style.top = (btnRect.bottom + 12) + 'px';
}

function positionMagnifierBtn() {
  var btn = document.getElementById('magnifier-btn');
  if (!btn || btn.style.display === 'none') return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;
  var rect = img.getBoundingClientRect();
  var blackLeft = rect.left;
  var visibleHeight = window.innerHeight - 80;
  var btnSize = 80;
  if (blackLeft > 70) {
    btn.style.left = (blackLeft / 2 - btnSize / 2) + 'px';
    btn.style.top = (visibleHeight / 2 - btnSize / 2) + 'px';
    btn.style.transform = '';
  } else {
    btn.style.left = '16px';
    btn.style.top = '16px';
    btn.style.transform = '';
  }
}

function updateMagnifierVisibility() {
  var btn = document.getElementById('magnifier-btn');
  if (!btn) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  var img = slide ? slide.querySelector('.image-center > img') : null;
  btn.style.display = img ? 'flex' : 'none';
  if (magnifierActive && !img) toggleMagnifier();
  if (magnifierClone) { magnifierClone.remove(); magnifierClone = null; }
  if (img) setTimeout(positionMagnifierBtn, 50);
}

function refreshMagnifierClone() {
  var lens = document.getElementById('magnifier-lens');
  if (!lens) return;
  if (magnifierClone) { magnifierClone.remove(); magnifierClone = null; }
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var imageCenter = slide.querySelector('.image-center');
  if (!imageCenter) return;
  magnifierClone = imageCenter.cloneNode(true);
  magnifierClone.style.position = 'absolute';
  magnifierClone.style.top = '0';
  magnifierClone.style.left = '0';
  magnifierClone.style.transform = 'scale(' + magnifierZoom + ')';
  magnifierClone.style.transformOrigin = '0 0';
  magnifierClone.style.pointerEvents = 'none';
  var clonedBoxes = magnifierClone.querySelectorAll('.box');
  for (var i = 0; i < clonedBoxes.length; i++) {
    clonedBoxes[i].style.animation = 'none';
  }
  lens.appendChild(magnifierClone);
}

document.addEventListener('mousemove', function(e) {
  if (!magnifierActive) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var imageCenter = slide.querySelector('.image-center');
  if (!imageCenter) return;
  var lens = document.getElementById('magnifier-lens');
  var containerRect = imageCenter.getBoundingClientRect();
  if (e.clientX < containerRect.left || e.clientX > containerRect.right ||
      e.clientY < containerRect.top || e.clientY > containerRect.bottom) {
    lens.style.display = 'none';
    return;
  }
  if (!magnifierClone || !lens.contains(magnifierClone)) refreshMagnifierClone();
  lens.style.display = 'block';
  lens.style.left = (e.clientX - magnifierLensW / 2) + 'px';
  lens.style.top = (e.clientY - magnifierLensH / 2) + 'px';
  var relX = e.clientX - containerRect.left;
  var relY = e.clientY - containerRect.top;
  if (magnifierClone) {
    magnifierClone.style.left = -(relX * magnifierZoom - magnifierLensW / 2) + 'px';
    magnifierClone.style.top = -(relY * magnifierZoom - magnifierLensH / 2) + 'px';
  }
});

/* ── TTS ── */
var ttsActive = false;

function initTts() {
  var btn = document.createElement('button');
  btn.className = 'tts-btn';
  btn.id = 'tts-btn';
  btn.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>';
  btn.title = 'הקראה בקול';
  btn.addEventListener('click', toggleTts);
  document.body.appendChild(btn);
}

function toggleTts() {
  var btn = document.getElementById('tts-btn');
  if (ttsActive) {
    speechSynthesis.cancel();
    ttsActive = false;
    btn.classList.remove('active');
    return;
  }
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var textEl = slide.querySelector('.text');
  if (!textEl) return;
  var text = textEl.innerText.replace(/^\d+\/\d+\s*/, '');
  if (!text.trim()) return;
  var utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'he-IL';
  utterance.rate = 0.85;
  utterance.onstart = function() { ttsActive = true; btn.classList.add('active'); };
  utterance.onend = function() { ttsActive = false; btn.classList.remove('active'); };
  utterance.onerror = function() { ttsActive = false; btn.classList.remove('active'); };
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

function positionTtsBtn() {
  var btn = document.getElementById('tts-btn');
  if (!btn || btn.style.display === 'none') return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;
  var rect = img.getBoundingClientRect();
  var blackRight = window.innerWidth - rect.right;
  var visibleHeight = window.innerHeight - 80;
  var btnSize = 80;
  if (blackRight > 70) {
    btn.style.right = (blackRight / 2 - btnSize / 2) + 'px';
    btn.style.left = '';
    btn.style.top = (visibleHeight / 2 - btnSize / 2) + 'px';
  } else {
    btn.style.right = '16px';
    btn.style.left = '';
    btn.style.top = '16px';
  }
}

function updateTtsVisibility() {
  var btn = document.getElementById('tts-btn');
  if (!btn) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  var textEl = slide ? slide.querySelector('.text') : null;
  btn.style.display = textEl ? 'flex' : 'none';
  if (ttsActive) {
    speechSynthesis.cancel();
    ttsActive = false;
    btn.classList.remove('active');
  }
  if (textEl) setTimeout(positionTtsBtn, 50);
}

/* ── Init ──
   DOMContentLoaded removed — each tutorial calls
   buildNavDots/initMagnifier/initTts/showSlides
   from its own initApp() after building slides.
*/

/* ── Enhanced Mobile Block ── */
function enhanceMobileBlock(tutorialKey) {
  var block = document.getElementById('mobile-block');
  if (!block) return;
  block.style.display = 'flex';
  // Fix padding for small phones
  block.style.padding = '24px 16px';
  block.style.overflowY = 'auto';

  // Replace the static content with an interactive form
  block.innerHTML = '' +
    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f6a67e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:16px;flex-shrink:0;">' +
      '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' +
    '</svg>' +
    '<div style="color:white;font-size:clamp(18px,5vw,22px);font-weight:900;margin-bottom:10px;line-height:1.3;">הדרכה זו מיועדת למחשב Windows</div>' +
    '<div style="color:#ffffffcc;font-size:clamp(13px,3.5vw,15px);line-height:1.7;margin-bottom:20px;">נשלח לכם את הקישור ב-WhatsApp ובאימייל,<br>ותוכלו לפתוח אותו במחשב.</div>' +

    '<div id="mb-form" style="width:100%;max-width:340px;">' +
      '<input id="mb-name" type="text" placeholder="השם שלכם" autocomplete="name" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #ffffff44;background:#ffffff18;color:white;font-family:Rubik,sans-serif;font-size:16px;margin-bottom:10px;text-align:right;direction:rtl;box-sizing:border-box;">' +
      '<input id="mb-phone" type="tel" placeholder="מספר WhatsApp" autocomplete="tel" dir="ltr" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #ffffff44;background:#ffffff18;color:white;font-family:Rubik,sans-serif;font-size:16px;margin-bottom:10px;text-align:right;box-sizing:border-box;">' +
      '<input id="mb-email" type="email" placeholder="אימייל" autocomplete="email" dir="ltr" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #ffffff44;background:#ffffff18;color:white;font-family:Rubik,sans-serif;font-size:16px;margin-bottom:16px;text-align:right;box-sizing:border-box;">' +
      '<button id="mb-send" onclick="sendMobileLink(\'' + tutorialKey + '\')" style="width:100%;padding:16px;border-radius:50px;border:none;background:#e8854a;color:white;font-family:Rubik,sans-serif;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 6px 24px rgba(232,133,74,0.4);transition:background 0.2s;">' +
        'שלחו לי את הקישור' +
      '</button>' +
      '<div id="mb-error" style="color:#ff6b6b;font-size:13px;margin-top:10px;display:none;text-align:center;"></div>' +
    '</div>' +

    '<div id="mb-success" style="display:none;text-align:center;">' +
      '<div style="width:56px;height:56px;background:#25d366;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
      '</div>' +
      '<div style="color:white;font-size:20px;font-weight:800;margin-bottom:8px;">הקישור נשלח!</div>' +
      '<div style="color:#ffffffcc;font-size:15px;line-height:1.7;">בדקו את ה-WhatsApp ואת האימייל שלכם.<br>פתחו את הקישור במחשב Windows.</div>' +
    '</div>' +

    '<div style="margin-top:20px;background:#f6a67e22;border:2px solid #f6a67e44;border-radius:14px;padding:12px 16px;width:100%;max-width:340px;">' +
      '<div style="color:#f6a67e;font-size:13px;font-weight:700;">למה רק במחשב?</div>' +
      '<div style="color:#ffffffaa;font-size:13px;margin-top:6px;line-height:1.6;">ההדרכה מדמה מחשב Windows אמיתי.<br>לוחצים על הסימונים הכתומים ולומדים תוך כדי עשייה.</div>' +
    '</div>';
}

function sendMobileLink(tutorialKey) {
  var name = document.getElementById('mb-name').value.trim();
  var phone = document.getElementById('mb-phone').value.trim();
  var email = document.getElementById('mb-email').value.trim();
  var errorEl = document.getElementById('mb-error');
  var btn = document.getElementById('mb-send');

  if (!phone && !email) {
    errorEl.textContent = 'נא למלא לפחות טלפון או אימייל';
    errorEl.style.display = 'block';
    return;
  }
  if (!name) {
    errorEl.textContent = 'נא למלא את השם';
    errorEl.style.display = 'block';
    return;
  }

  btn.textContent = 'שולח...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  fetch('/api/send-tutorial-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, phone: phone, email: email, tutorialKey: tutorialKey })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.sent) {
      document.getElementById('mb-form').style.display = 'none';
      document.getElementById('mb-success').style.display = 'block';
    } else {
      errorEl.textContent = 'לא הצלחנו לשלוח. נסו שוב';
      errorEl.style.display = 'block';
      btn.textContent = 'שלחו לי את הקישור';
      btn.disabled = false;
    }
  })
  .catch(function() {
    errorEl.textContent = 'שגיאה בשליחה. נסו שוב';
    errorEl.style.display = 'block';
    btn.textContent = 'שלחו לי את הקישור';
    btn.disabled = false;
  });
}

/* ── Keyboard + Resize ── */
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') { nextSlide(); }
  else if (event.key === 'ArrowLeft') { prevSlide(); }
  else if (event.key === 'Escape' && magnifierActive) { toggleMagnifier(); }
});

window.addEventListener('resize', function() {
  positionMagnifierBtn();
  positionTtsBtn();
});

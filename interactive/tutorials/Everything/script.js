let slideIndex = 1;

function nextSlide() {
  showSlides(slideIndex + 1);
}

function prevSlide() {
  showSlides(slideIndex - 1);
}

function currentSlide(n) {
  showSlides(n);
}

function showSlides(n) {
  let slides = document.getElementsByClassName("mySlides");

  if (n > slides.length) {return}
  if (n < 1) {return}

  slideIndex = n;

  let next = document.getElementById("right-arrow");
  let previous = document.getElementById("left-arrow");

  if (n == slides.length) {
    next.src = ".//images//right-disabled.png";
    next.style.cursor = "default";
  } else {
    next.src = ".//images//right.png";
    next.style.cursor = "pointer";
  }
  if (n == 1) {
    previous.src = ".//images//left-disabled.png";
    previous.style.cursor = "default";
  } else {
    previous.src = ".//images//left.png";
    previous.style.cursor = "pointer";
  }

  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
  setNavBarColor(slideIndex);
  updateMagnifierVisibility();
  updateTtsVisibility();
}

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

// ─── SVG אייקונים לשקפים מיוחדים ───
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

// ─── מפת שקפים: אינדקס (0-based) → {icon, title} ───
// שקפים שלא במפה = ממוספרים אוטומטית
var slideMap = {
  0:  { icon: 'home',     title: 'פתיחה' },
  1:  { icon: 'play',     title: 'איך עובדים עם ההדרכה' },
  2:  { icon: 'download', title: 'הורידו את Everything' },
  5:  { icon: 'warning',  title: 'בקרת חשבון משתמש' },
  12: { icon: 'usage',    title: 'שימוש בתוכנה' },
  36: { icon: 'finish',   title: 'סיום' }
};

// יצירת נקודות ניווט דינמית
function buildNavDots() {
  let slides = document.getElementsByClassName("mySlides");
  let container = document.querySelector('.nav-dots');
  if (!container) return;

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
      dot.addEventListener('click', function() {
        showSlides(index + 1);
      });
    })(i);
    container.appendChild(dot);
  }
}

// ─── זכוכית מגדלת ───
var magnifierActive = false;
var magnifierZoom = 2;         // ×2 — הגדלה ברורה ונוחה
var magnifierLensW = 420;
var magnifierLensH = 300;

function initMagnifier() {
  // Create button
  var btn = document.createElement('button');
  btn.className = 'magnifier-btn';
  btn.id = 'magnifier-btn';
  btn.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>';
  btn.title = 'זכוכית מגדלת';
  btn.addEventListener('click', toggleMagnifier);
  document.body.appendChild(btn);

  // Create lens
  var lens = document.createElement('div');
  lens.className = 'magnifier-lens';
  lens.id = 'magnifier-lens';
  document.body.appendChild(lens);

  // Create escape hint (shown only when magnifier active)
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

  // Center hint horizontally in the black area, below button
  escHint.style.maxWidth = Math.max(60, blackLeft - 8) + 'px';
  var hintLeft = Math.max(4, blackLeft / 2 - escHint.offsetWidth / 2);
  escHint.style.left = hintLeft + 'px';
  escHint.style.top = (btnRect.bottom + 12) + 'px';
}

// Position button centered in the VISIBLE black area (excluding 80px nav bar)
function positionMagnifierBtn() {
  var btn = document.getElementById('magnifier-btn');
  if (!btn || btn.style.display === 'none') return;

  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;

  var rect = img.getBoundingClientRect();
  var blackLeft = rect.left; // width of black area on the left
  var visibleHeight = window.innerHeight - 80; // subtract nav bar
  var btnSize = 80;

  if (blackLeft > 70) {
    // Center button in the visible black area
    btn.style.left = (blackLeft / 2 - btnSize / 2) + 'px';
    btn.style.top = (visibleHeight / 2 - btnSize / 2) + 'px';
    btn.style.transform = '';
  } else {
    // Narrow screen — top-left corner
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
  // Hide lens when changing slides
  if (magnifierActive && !img) {
    toggleMagnifier();
  }
  // Clean up old clone on slide change
  if (magnifierClone) { magnifierClone.remove(); magnifierClone = null; }
  // Reposition after display change
  if (img) {
    setTimeout(positionMagnifierBtn, 50);
  }
}

// Clone slide content into lens for magnification (images + text + boxes)
var magnifierClone = null;

function refreshMagnifierClone() {
  var lens = document.getElementById('magnifier-lens');
  if (!lens) return;
  // Remove old clone
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
  // Remove animations from cloned boxes
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

  // Check if mouse is over the slide content area
  if (e.clientX < containerRect.left || e.clientX > containerRect.right ||
      e.clientY < containerRect.top || e.clientY > containerRect.bottom) {
    lens.style.display = 'none';
    return;
  }

  // Create clone if needed
  if (!magnifierClone || !lens.contains(magnifierClone)) {
    refreshMagnifierClone();
  }

  lens.style.display = 'block';

  // Position lens centered on cursor
  var lensX = e.clientX - magnifierLensW / 2;
  var lensY = e.clientY - magnifierLensH / 2;
  lens.style.left = lensX + 'px';
  lens.style.top = lensY + 'px';

  // Position the clone inside the lens so the zoomed area under cursor is centered
  var relX = e.clientX - containerRect.left;
  var relY = e.clientY - containerRect.top;

  var cloneX = -(relX * magnifierZoom - magnifierLensW / 2);
  var cloneY = -(relY * magnifierZoom - magnifierLensH / 2);

  if (magnifierClone) {
    magnifierClone.style.left = cloneX + 'px';
    magnifierClone.style.top = cloneY + 'px';
  }
});

window.addEventListener('resize', function() {
  positionMagnifierBtn();
  positionTtsBtn();
});

// ─── הקראה בקול (TTS) ───
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
    // Stop speaking
    speechSynthesis.cancel();
    ttsActive = false;
    btn.classList.remove('active');
    return;
  }

  // Get current slide text
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var textEl = slide.querySelector('.text');
  if (!textEl) return;

  // Extract clean text from the bubble
  var text = textEl.innerText.replace(/^\d+\/\d+\s*/, ''); // remove step counter
  if (!text.trim()) return;

  var utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = 'he-IL';
  utterance.rate = 0.85; // קצת יותר איטי — נוח למבוגרים

  utterance.onstart = function() {
    ttsActive = true;
    btn.classList.add('active');
  };
  utterance.onend = function() {
    ttsActive = false;
    btn.classList.remove('active');
  };
  utterance.onerror = function() {
    ttsActive = false;
    btn.classList.remove('active');
  };

  speechSynthesis.cancel(); // cancel any previous
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
  var blackRight = window.innerWidth - rect.right; // width of black area on the right
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
  // Stop speaking when changing slides
  if (ttsActive) {
    speechSynthesis.cancel();
    ttsActive = false;
    btn.classList.remove('active');
  }
  if (textEl) {
    setTimeout(positionTtsBtn, 50);
  }
}

document.addEventListener("DOMContentLoaded", function() {
  buildNavDots();
  initMagnifier();
  initTts();
  showSlides(slideIndex);
});

// ניווט במקלדת
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') { nextSlide(); }
  else if (event.key === 'ArrowLeft') { prevSlide(); }
  else if (event.key === 'Escape' && magnifierActive) { toggleMagnifier(); }
});

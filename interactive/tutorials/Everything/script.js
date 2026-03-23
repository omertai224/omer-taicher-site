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
  2:  { icon: 'search',   title: 'הכירו את Everything' },
  3:  { icon: 'download', title: 'הורידו את Everything' },
  6:  { icon: 'install',  title: 'התקנה' },
  7:  { icon: 'warning',  title: 'בקרת חשבון משתמש' },
  14: { icon: 'usage',    title: 'שימוש בתוכנה' },
  38: { icon: 'finish',   title: 'סיום' }
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
var magnifierZoom = 1.25;      // 125% — עדין ונוח
var magnifierLensW = 300;
var magnifierLensH = 220;

function initMagnifier() {
  // Create button
  var btn = document.createElement('button');
  btn.className = 'magnifier-btn';
  btn.id = 'magnifier-btn';
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>';
  btn.title = 'זכוכית מגדלת';
  btn.addEventListener('click', toggleMagnifier);
  document.body.appendChild(btn);

  // Create lens
  var lens = document.createElement('div');
  lens.className = 'magnifier-lens';
  lens.id = 'magnifier-lens';
  document.body.appendChild(lens);

  // Create hint
  var hint = document.createElement('div');
  hint.className = 'magnifier-hint';
  hint.id = 'magnifier-hint';
  hint.textContent = 'הזיזו את העכבר על התמונה להגדלה';
  document.body.appendChild(hint);
}

function toggleMagnifier() {
  magnifierActive = !magnifierActive;
  var btn = document.getElementById('magnifier-btn');
  var lens = document.getElementById('magnifier-lens');
  var hint = document.getElementById('magnifier-hint');

  if (magnifierActive) {
    btn.classList.add('active');
    hint.style.display = 'block';
    document.body.classList.add('magnifier-active');
  } else {
    btn.classList.remove('active');
    lens.style.display = 'none';
    hint.style.display = 'none';
    document.body.classList.remove('magnifier-active');
  }
}

// Position button centered in the black area (left of the image)
function positionMagnifierBtn() {
  var btn = document.getElementById('magnifier-btn');
  if (!btn || btn.style.display === 'none') return;

  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;

  var rect = img.getBoundingClientRect();
  var blackLeft = rect.left; // width of black area on the left

  if (blackLeft > 70) {
    // Center button in the black area
    btn.style.left = (blackLeft / 2 - 24) + 'px';
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';
  } else {
    // Narrow screen — top-left corner
    btn.style.left = '16px';
    btn.style.top = '16px';
    btn.style.transform = '';
  }

  // Position hint below button
  var hint = document.getElementById('magnifier-hint');
  if (hint) {
    var btnRect = btn.getBoundingClientRect();
    hint.style.left = btnRect.left + 'px';
    hint.style.top = (btnRect.bottom + 8) + 'px';
  }
}

function updateMagnifierVisibility() {
  var btn = document.getElementById('magnifier-btn');
  if (!btn) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  var img = slide ? slide.querySelector('.image-center > img') : null;
  btn.style.display = img ? 'flex' : 'none';
  // Hide lens & restore text when changing slides
  if (magnifierActive && !img) {
    toggleMagnifier();
  }
  // Reposition after display change
  if (img) {
    setTimeout(positionMagnifierBtn, 50);
  }
}

document.addEventListener('mousemove', function(e) {
  if (!magnifierActive) return;
  var slide = document.getElementsByClassName('mySlides')[slideIndex - 1];
  if (!slide) return;
  var img = slide.querySelector('.image-center > img');
  if (!img) return;

  var lens = document.getElementById('magnifier-lens');
  var rect = img.getBoundingClientRect();

  // Work on both the image AND text bubbles
  var textEl = slide.querySelector('.text');
  var textRect = textEl ? textEl.getBoundingClientRect() : null;

  var overImage = (e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom);
  var overText = textRect && (e.clientX >= textRect.left && e.clientX <= textRect.right &&
                  e.clientY >= textRect.top && e.clientY <= textRect.bottom);

  if (!overImage && !overText) {
    lens.style.display = 'none';
    return;
  }

  lens.style.display = 'block';

  // Position lens centered on cursor
  var lensX = e.clientX - magnifierLensW / 2;
  var lensY = e.clientY - magnifierLensH / 2;
  lens.style.left = lensX + 'px';
  lens.style.top = lensY + 'px';

  // Calculate background from image
  var imgW = img.naturalWidth;
  var imgH = img.naturalHeight;
  var scaleX = imgW / rect.width;
  var scaleY = imgH / rect.height;

  var relX = e.clientX - rect.left;
  var relY = e.clientY - rect.top;

  var bgW = imgW * magnifierZoom;
  var bgH = imgH * magnifierZoom;

  var bgX = -(relX * scaleX * magnifierZoom - magnifierLensW / 2);
  var bgY = -(relY * scaleY * magnifierZoom - magnifierLensH / 2);

  lens.style.backgroundImage = 'url("' + img.src + '")';
  lens.style.backgroundSize = bgW + 'px ' + bgH + 'px';
  lens.style.backgroundPosition = bgX + 'px ' + bgY + 'px';
});

window.addEventListener('resize', positionMagnifierBtn);

document.addEventListener("DOMContentLoaded", function() {
  buildNavDots();
  initMagnifier();
  showSlides(slideIndex);
});

// ניווט במקלדת
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') { nextSlide(); }
  else if (event.key === 'ArrowLeft') { prevSlide(); }
  else if (event.key === 'Escape' && magnifierActive) { toggleMagnifier(); }
});

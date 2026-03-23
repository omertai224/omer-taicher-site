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
  // בית — מסך פתיחה
  home: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>',
  // Play — סרטון
  play: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,3 20,12 6,21"/></svg>',
  // הורדה — שקף מעבר הורדה
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v10M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>',
  // מסך/שימוש — שקף מעבר שימוש
  monitor: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  // סיום — לב/צ'ק
  finish: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
};

// ─── מפת שקפים: אינדקס (0-based) → {icon, title} ───
// שקפים שלא במפה = ממוספרים אוטומטית
var slideMap = {
  0:  { icon: 'home',     title: 'פתיחה' },
  1:  { icon: 'play',     title: 'איך עובדים עם ההדרכה' },
  2:  { icon: 'play',     title: 'הכירו את Vibe' },
  3:  { icon: 'download', title: 'הורידו את Vibe' },
  15: { icon: 'monitor',  title: 'השתמשו ב-Vibe' },
  30: { icon: 'finish',   title: 'סיום' }
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
      // שקף מיוחד — אייקון SVG
      dot.innerHTML = specialIcons[special.icon] || '';
      dot.title = special.title;
      dot.classList.add('nav-dot-icon');
    } else {
      // צעד רגיל — מספר
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

document.addEventListener("DOMContentLoaded", function() {
  buildNavDots();
  showSlides(slideIndex);
});

// ניווט במקלדת
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') { nextSlide(); }
  else if (event.key === 'ArrowLeft') { prevSlide(); }
});

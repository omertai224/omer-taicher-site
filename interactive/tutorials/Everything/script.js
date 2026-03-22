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

// יצירת נקודות ניווט דינמית
function buildNavDots() {
  let slides = document.getElementsByClassName("mySlides");
  let container = document.querySelector('.nav-dots');
  if (!container) return;

  let half = Math.ceil(slides.length / 2);
  let row1 = document.createElement('div');
  let row2 = document.createElement('div');
  row1.className = 'nav-row';
  row2.className = 'nav-row';

  for (let i = 0; i < slides.length; i++) {
    let dot = document.createElement('button');
    dot.className = 'nav-dot';
    var skipStart = 3; // מסכי פתיחה בלי מספר
    var skipEnd = 1;   // מסך סיום בלי מספר
    var isNumbered = (i >= skipStart && i < slides.length - skipEnd);
    var stepNum = isNumbered ? (i - skipStart + 1) : '';
    dot.title = isNumbered ? stepNum.toString() : (i < skipStart ? ['פתיחה','סרטון','הסבר'][i] : 'סיום');
    dot.textContent = stepNum.toString();
    (function(index) {
      dot.addEventListener('click', function() {
        showSlides(index + 1);
      });
    })(i);
    if (i < half) { row1.appendChild(dot); } else { row2.appendChild(dot); }
  }

  container.appendChild(row1);
  container.appendChild(row2);
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

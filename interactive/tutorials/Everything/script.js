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

  for (let i = 0; i < slides.length; i++) {
    let dot = document.createElement('button');
    dot.className = 'nav-dot';
    dot.title = (i + 1).toString();
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

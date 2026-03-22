let slideIndex = 1;
showSlides(slideIndex);

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
  let i;
  let slides = document.getElementsByClassName("mySlides");
  
  if (n > slides.length) {return}
  if (n < 1) {return}
  
  slideIndex = n;
  
  next = document.getElementById("right-arrow");
  previous = document.getElementById("left-arrow");
  
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
  
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  slides[slideIndex - 1].style.display = "block";
  setNavBarColor(slideIndex);
}

function setNavBarColor(n) {
  let navbars = document.getElementsByClassName("nav");
  for (i = 0; i < navbars.length; i++) {
    navbars[i].style.backgroundColor = "#a8c5d6";
    navbars[i].style.cursor = "pointer";
    if (navbars[i].id <= n - 1) {
      navbars[i].style.backgroundColor = "#1e5f74";
    }
  }
}

// לחיצה על ריבוע ניווט לקפיצה ישירה לשקף
function initNavClick() {
  let navbars = document.getElementsByClassName("nav");
  for (let i = 0; i < navbars.length; i++) {
    (function(index) {
      navbars[index].addEventListener("click", function() {
        showSlides(index + 1);
      });
    })(i);
  }
}
document.addEventListener("DOMContentLoaded", initNavClick);

// ניווט במקלדת
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') { nextSlide(); }
  else if (event.key === 'ArrowLeft') { prevSlide(); }
});

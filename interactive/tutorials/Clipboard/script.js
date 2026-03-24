let slideIndex = 1;
showSlides(slideIndex);

function nextSlide() {
  showSlides(slideIndex + 1);
}

function prevSlide() {
  showSlides(slideIndex + -1);
}

function currentSlide(n) {
  showSlides(n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  
  if (n > slides.length) {return}
  if (n < 1) {return}
  
  slideIndex = n
  
  next = document.getElementById("right-arrow");
  previous = document.getElementById("left-arrow");
  
  if (n == slides.length) 
  {
	next.src = ".//images//right-disabled.png";
	next.style.cursor = "default";
  }
  else 
  {
	next.src = ".//images//right.png";
	next.style.cursor = "pointer";
  }
  if(n == 1) 
  {
	previous.src = ".//images//left-disabled.png";
	previous.style.cursor = "default";
  }
  else 
  {
	previous.src = ".//images//left.png";
	previous.style.cursor = "pointer";
  }
  
  for (i = 0; i < slides.length; i++) {
	slides[i].style.display = "none"; 
  }
  slides[slideIndex-1].style.display = "block";
  setNavBarColor(slideIndex);
}

function setNavBarColor(n){
  let navbars = document.getElementsByClassName("nav");
 
  for(i = 0; i < navbars.length; i++){
	   navbars[i].style.backgroundColor = "LightGray";
	   if(navbars[i].id <= n-1){navbars[i].style.backgroundColor = "rgb(32,48,52)"}
  }
}

// Add keyboard navigation for slides
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') {
    nextSlide(); // Go to next slide
  } else if (event.key === 'ArrowLeft') {
    prevSlide(); // Go to previous slide
  }
});
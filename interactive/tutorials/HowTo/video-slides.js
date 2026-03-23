let current = 0;

function changeSlide(dir) {
  const slides = document.querySelectorAll('.slide');
  slides[current].classList.remove('active');
  current = Math.max(0, Math.min(slides.length - 1, current + dir));
  slides[current].classList.add('active');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowLeft')  changeSlide(1);
  if (e.key === 'ArrowRight') changeSlide(-1);
});

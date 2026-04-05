/* ===== LECTURE SUMMARY - Shared JS ===== */

// Scroll animations - fade in cards, tools, FAQ items
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); }
    });
  }, { threshold:0.15 });
  document.querySelectorAll('.card, .tool-card, .faq-item').forEach(function(el, i){
    el.style.transitionDelay = (i % 4) * 0.1 + 's';
    observer.observe(el);
  });
})();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(q){
  q.addEventListener('click', function(){
    var item = this.parentElement;
    var wasOpen = item.classList.contains('open');
    // close all
    document.querySelectorAll('.faq-item.open').forEach(function(el){ el.classList.remove('open'); });
    // toggle clicked
    if(!wasOpen) item.classList.add('open');
  });
});

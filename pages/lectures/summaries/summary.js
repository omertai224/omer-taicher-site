/* ===== LECTURE SUMMARY - Shared JS ===== */

// Scroll animations
(function(){
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); }
    });
  }, { threshold:0.15 });
  document.querySelectorAll('.card, .tool-card, .faq-item, .quiz-q').forEach(function(el, i){
    el.style.transitionDelay = (i % 4) * 0.1 + 's';
    observer.observe(el);
  });
})();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function(q){
  q.addEventListener('click', function(){
    var item = this.parentElement;
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function(el){ el.classList.remove('open'); });
    if(!wasOpen) item.classList.add('open');
  });
});

// Quiz engine
(function(){
  var answered = 0;
  var correct = 0;
  var total = document.querySelectorAll('.quiz-q').length;
  if(!total) return;

  document.querySelectorAll('.quiz-opt').forEach(function(opt){
    opt.addEventListener('click', function(){
      var q = this.closest('.quiz-q');
      if(q.classList.contains('answered')) return;
      q.classList.add('answered');
      answered++;

      var isCorrect = this.getAttribute('data-correct') === 'true';
      var feedback = q.querySelector('.quiz-feedback');

      // Mark all options
      q.querySelectorAll('.quiz-opt').forEach(function(o){
        o.classList.add('disabled');
        if(o.getAttribute('data-correct') === 'true') o.classList.add('correct');
      });

      if(isCorrect){
        this.classList.add('correct');
        correct++;
        feedback.className = 'quiz-feedback show correct';
        feedback.textContent = q.getAttribute('data-correct-text') || 'נכון!';
      } else {
        this.classList.add('wrong');
        feedback.className = 'quiz-feedback show wrong';
        feedback.textContent = q.getAttribute('data-wrong-text') || 'לא מדויק. ' + (q.getAttribute('data-explain') || '');
      }

      // Show score when all answered
      if(answered === total){
        var scoreEl = document.querySelector('.quiz-score');
        if(scoreEl){
          scoreEl.classList.add('show');
          scoreEl.querySelector('.score-num').textContent = correct + '/' + total;
          var pct = Math.round(correct/total*100);
          var msg = pct === 100 ? 'מושלם! אתם בלשים אמיתיים!' :
                    pct >= 60 ? 'כל הכבוד! יש לכם ידע טוב.' :
                    'שווה לצפות שוב בהרצאה ולחזק את הידע.';
          scoreEl.querySelector('.score-msg').textContent = msg;
        }
      }
    });
  });
})();

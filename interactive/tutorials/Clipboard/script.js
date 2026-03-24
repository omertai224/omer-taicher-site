/* Clipboard Tutorial - Dynamic Slide Builder */

var slideIndex = 1;
var slidesData = null;

/* ── App Init ── */
function initApp() {
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
    document.getElementById('mobile-block').style.display = 'flex';
    return;
  }
  // Load slides data
  fetch('slides.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      slidesData = data;
      buildSlides(data.slides, data.totalSteps);
      buildNavDots();
      showSlides(1);
    });
}

/* ── Build Slides from JSON ── */
function buildSlides(slides, totalSteps) {
  var container = document.getElementById('slideshow');
  var html = '';

  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];

    if (s.type === 'intro') {
      html += '<div class="mySlides fade"><div class="background">'
        + '<div class="title">' + s.title + '</div>';
      if (s.subtitles) {
        for (var j = 0; j < s.subtitles.length; j++) {
          html += '<div class="subtitle">' + s.subtitles[j] + '</div>';
        }
      }
      html += '<a onclick="nextSlide()"><div class="button start">התחילו</div></a>'
        + '</div></div>';

    } else if (s.type === 'outro') {
      html += '<div class="mySlides fade"><div class="background">'
        + '<div class="title">' + s.title + '</div>'
        + '<a onclick="showSlides(1)"><div class="button start">מההתחלה</div></a>'
        + '</div></div>';

    } else if (s.type === 'view') {
      // View slide - image with Next button, no clickable box
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;">';
      // Text bubble
      var arrowClass = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      var posStyle = buildTextPos(s.textPos);
      html += '<div class="text' + arrowClass + '" style="' + posStyle + 'position:absolute;width:300;height:fit-content;">'
        + '<div style="text-align:right;">' + s.step + '<span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
        + '<b style="font-size:24px;padding:8px 0;"></b>'
        + '<div dir="rtl">' + (s.text || '') + '</div>'
        + '<a class="button" onclick="nextSlide()">המשך</a>'
        + '</div>';
      html += '</div></div></div>';

    } else {
      // Click slide - image with clickable box
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;">';
      // Box
      if (s.box) {
        html += '<div class="box" data-box="' + s.boxClass + '" style="'
          + 'top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom + ';"'
          + ' onclick="nextSlide()"></div>';
      }
      // Text bubble
      var arrowClass2 = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      var posStyle2 = buildTextPos(s.textPos);
      html += '<div class="text' + arrowClass2 + '" style="' + posStyle2 + 'position:absolute;width:300;height:fit-content;">'
        + '<div style="text-align:right;">' + s.step + '<span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
        + '<b style="font-size:24px;padding:8px 0;"></b>'
        + '<div dir="rtl">' + (s.text || '') + '</div>'
        + '</div>';
      html += '</div></div></div>';
    }
  }

  container.innerHTML = html;
}

function buildTextPos(pos) {
  if (!pos) return '';
  var s = '';
  if (pos.left) s += 'left:' + pos.left + ';';
  if (pos.top) s += 'top:' + pos.top + ';';
  if (pos.bottom) s += 'bottom:' + pos.bottom + ';';
  return s;
}

/* ── Navigation ── */
function nextSlide() {
  showSlides(slideIndex + 1);
}

function prevSlide() {
  showSlides(slideIndex - 1);
}

function showSlides(n) {
  var slides = document.getElementsByClassName('mySlides');
  if (n > slides.length || n < 1) return;

  slideIndex = n;

  for (var i = 0; i < slides.length; i++) {
    slides[i].style.display = 'none';
  }
  slides[n - 1].style.display = 'block';

  // Update arrows
  var next = document.getElementById('right-arrow');
  var prev = document.getElementById('left-arrow');
  if (n === slides.length) {
    next.src = './images/right-disabled.png';
    next.style.cursor = 'default';
  } else {
    next.src = './images/right.png';
    next.style.cursor = 'pointer';
  }
  if (n === 1) {
    prev.src = './images/left-disabled.png';
    prev.style.cursor = 'default';
  } else {
    prev.src = './images/left.png';
    prev.style.cursor = 'pointer';
  }

  setNavBarColor(n);
}

/* ── Nav Dots ── */
function buildNavDots() {
  var slides = document.getElementsByClassName('mySlides');
  var container = document.querySelector('.nav-dots');
  if (!container) return;

  var cols = Math.ceil(slides.length / 2);
  container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  for (var i = 0; i < slides.length; i++) {
    var dot = document.createElement('button');
    dot.className = 'nav-dot';
    dot.textContent = (i + 1).toString();
    dot.title = (i + 1).toString();
    (function(index) {
      dot.addEventListener('click', function() { showSlides(index + 1); });
    })(i);
    container.appendChild(dot);
  }
}

function setNavBarColor(n) {
  var dots = document.getElementsByClassName('nav-dot');
  for (var i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('active', i < n);
  }
}

/* ── Keyboard ── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowRight') nextSlide();
  else if (e.key === 'ArrowLeft') prevSlide();
});

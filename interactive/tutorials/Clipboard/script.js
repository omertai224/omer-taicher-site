/* Clipboard Tutorial - Dynamic slide builder
   Loaded BEFORE ../../shared/script.js which provides:
   slideIndex, nextSlide, prevSlide, showSlides, buildNavDots,
   setNavBarColor, initMagnifier, initTts, specialIcons, etc.
*/

var slidesData = null;

/* ── App Init ── */
function initApp() {
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
    document.getElementById('mobile-block').style.display = 'flex';
    return;
  }
  fetch('slides.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      slidesData = data;
      buildSlides(data.slides, data.totalSteps);
      buildNavDots();
      // Color specific step dots orange (keep number, just orange)
      if (window.orangeSteps) {
        var dots = document.getElementsByClassName('nav-dot');
        for (var i = 0; i < dots.length; i++) {
          if (orangeSteps.indexOf(i) > -1) {
            dots[i].classList.add('nav-dot-icon');
          }
        }
      }
      initMagnifier();
      initTts();
      showSlides(1);
    })
    .catch(function(err) { console.error('Clipboard ERROR:', err); });
}

/* ── Build Slides from JSON ── */
function buildSlides(slides, totalSteps) {
  var container = document.getElementById('slideshow');
  var html = '';

  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];

    if (s.html) {
      html += '<div class="mySlides fade">' + s.html + '</div>';

    } else if (s.type === 'intro') {
      html += '<div class="mySlides fade"><div class="background">'
        + '<div class="title">' + s.title + '</div>';
      if (s.subtitle) {
        html += '<div class="intro-desc" style="color:#ffffffcc;font-size:17px;line-height:1.8;max-width:600px;margin:16px auto 0;text-align:center;">' + s.subtitle + '</div>';
      }
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
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;">';
      if (s.box) {
        html += '<div class="box" style="'
          + 'top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom
          + ';pointer-events:none;animation:none;"></div>';
      }
      var ac = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      var ps = buildTextPos(s.textPos);
      var tw = s.textWidth || '300px';
      html += '<div class="text' + ac + '" style="' + ps + 'position:absolute;width:' + tw + ';height:fit-content;">'
        + '<div style="text-align:right;"><span style="color:#f6a67e;font-weight:700;">' + s.step + '</span><span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
        + '<b style="font-size:24px;padding:8px 0;"></b>'
        + '<div dir="rtl">' + (s.text || '') + '</div>'
        + '<div style="text-align:center;margin-top:12px;">לחצו על <span onclick="nextSlide()" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;background:linear-gradient(135deg,#1a2540,#3d5a80);border:2px solid white;border-radius:50%;cursor:pointer;vertical-align:middle;margin:0 6px;box-shadow:0 4px 12px rgba(26,37,64,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span> כדי להמשיך בהדרכה.</div>'
        + '</div>';
      html += '</div></div></div>';

    } else {
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;">';
      if (s.box) {
        html += '<div class="box" style="'
          + 'top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom + ';"'
          + ' onclick="nextSlide()"></div>';
      }
      var ac2 = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      var ps2 = buildTextPos(s.textPos);
      var tw2 = s.textWidth || '300px';
      html += '<div class="text' + ac2 + '" style="' + ps2 + 'position:absolute;width:' + tw2 + ';height:fit-content;">'
        + '<div style="text-align:right;"><span style="color:#f6a67e;font-weight:700;">' + s.step + '</span><span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
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

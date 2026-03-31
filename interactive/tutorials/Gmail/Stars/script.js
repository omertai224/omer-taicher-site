/* Gmail Stars Tutorial - Dynamic slide builder
   Loaded BEFORE ../../../shared/script.js which provides:
   slideIndex, nextSlide, prevSlide, showSlides, buildNavDots,
   setNavBarColor, initMagnifier, initTts, specialIcons, etc.
*/

var slidesData = null;

window.bubbleDesignWidth = 1019;

/* ── App Init ── */
function initApp() {
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
    enhanceMobileBlock('stars');
    return;
  }
  fetch('slides.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      slidesData = data;
      buildSlides(data.slides, data.totalSteps);
      buildNavDots();
      initMagnifier();
      initTts();
      showSlides(1);
    })
    .catch(function(err) { console.error('Gmail Stars ERROR:', err); });
}

function getPersonalName() {
  var params = new URLSearchParams(window.location.search);
  var name = params.get('u');
  if (name) { localStorage.setItem('stars_user_display', name); return name; }
  return localStorage.getItem('stars_user_display') || '';
}

function showPersonalBadge() {
  var name = getPersonalName();
  if (!name) return;
  var badge = document.createElement('div');
  badge.id = 'user-badge';
  badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b8fa8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-left:5px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
    '<span style="color:#ffffffaa;font-size:11px;">מחובר כ:</span> ' +
    '<span style="color:white;font-weight:700;font-size:12px;">' + name + '</span>';
  badge.style.cssText = 'position:fixed;top:12px;left:12px;z-index:9000;background:#0f1a2eee;border:1px solid #ffffff22;border-radius:20px;padding:6px 14px;font-family:Rubik,sans-serif;display:flex;align-items:center;gap:4px;backdrop-filter:blur(8px);box-shadow:0 4px 16px #00000044;';
  document.body.appendChild(badge);
}

function showTutorial() { showPersonalBadge(); setNavBarColor(1); showSlides(1); }

function buildSlides(slides, totalSteps) {
  var container = document.getElementById('slideshow');
  slides.forEach(function(s) {
    var div = document.createElement('div');
    div.className = 'mySlides';
    if (s.type === 'intro' || s.type === 'special' || s.html) {
      div.innerHTML = s.html || '';
    } else if (s.image) {
      var imgSrc = 'images/' + s.image;
      div.innerHTML = '<div class="image"><div class="image-center"><img src="' + imgSrc + '" style="max-height:calc(100vh - 80px);width:auto;max-width:100%;display:block;margin:0 auto;">';
      if (s.box) {
        var boxStyle = 'top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom;
        if (s.type === 'view') {
          div.innerHTML += '<div class="box" style="' + boxStyle + ';pointer-events:none;animation:none;opacity:0.7;"></div>';
        } else {
          div.innerHTML += '<div class="box" style="' + boxStyle + ';cursor:pointer;" onclick="nextSlide()"></div>';
        }
      }
      if (s.text && s.textPos) {
        var arrowClass = s.arrow || 'arrow-right';
        var stepHtml = '';
        if (s.step) {
          stepHtml = '<div style="text-align:right;"><span style="font-size:16px;font-weight:700;color:#f6a67e;">' + s.step + '</span><span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div><b style="font-size:24px;padding:8px 0;"></b>';
        }
        var w = s.textWidth || '280px';
        var posStyle = 'position:absolute;width:' + w + ';height:fit-content;';
        if (s.textPos.left) posStyle += 'left:' + s.textPos.left + ';';
        if (s.textPos.top) posStyle += 'top:' + s.textPos.top + ';';
        if (s.textPos.bottom) posStyle += 'bottom:' + s.textPos.bottom + ';';
        div.innerHTML += '<div class="text ' + arrowClass + '" style="' + posStyle + '">' + stepHtml + '<div style="text-align:right;">' + s.text + '</div></div>';
      }
      if (s.type === 'view' && !s.text) {
        div.innerHTML += '<div onclick="nextSlide()" style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);width:44px;height:44px;background:linear-gradient(135deg,#1a2540,#3d5a80);border:2px solid #5b8fa8;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(26,37,64,0.5);z-index:5;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div>';
      }
      div.innerHTML += '</div></div>';
    }
    container.appendChild(div);
  });
}

function buildTextPos(pos) {
  if (!pos) return '';
  var s = '';
  if (pos.left) s += 'left:' + pos.left + ';';
  if (pos.top) s += 'top:' + pos.top + ';';
  if (pos.bottom) s += 'bottom:' + pos.bottom + ';';
  return s;
}

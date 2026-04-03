/* Windows Cursor Tutorial */
var slidesData = null;
window.bubbleDesignWidth = 853;

var slideMap = {
  0: { icon: 'home', title: 'פתיחה' },
  1: { icon: 'play', title: 'איך עובדים עם ההדרכה' },
  2: { icon: 'play', title: 'כלים שיעזרו לכם' }
};

function initApp() {
  var ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
    enhanceMobileBlock('cursor'); return;
  }
  fetch('slides.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      slidesData = data;
      buildSlides(data.slides, data.totalSteps);
      buildNavDots(); initMagnifier(); initTts(); showSlides(1);
    })
    .catch(function(err) { console.error('Cursor ERROR:', err); });
}

function buildSlides(slides, totalSteps) {
  var container = document.getElementById('slideshow');
  var html = '';
  for (var i = 0; i < slides.length; i++) {
    var s = slides[i];
    if (s.specialType === 'howto-shared' && typeof buildHowToSlide1 === 'function') {
      html += '<div class="mySlides fade">' + buildHowToSlide1() + '</div>';
    } else if (s.specialType === 'howto-shared-2' && typeof buildHowToSlide2 === 'function') {
      html += '<div class="mySlides fade">' + buildHowToSlide2() + '</div>';
    } else if (s.html) { html += '<div class="mySlides fade">' + s.html + '</div>'; }
    else if (s.type === 'view') {
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;max-width:100%;">';
      if (s.box) html += '<div class="box view-highlight" style="top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom + ';"></div>';
      var ac = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      html += '<div class="text' + ac + '" style="' + buildTextPos(s.textPos) + 'position:absolute;width:' + (s.textWidth||'300px') + ';height:fit-content;">'
        + '<div style="text-align:right;"><span style="color:#f6a67e;font-weight:700;">' + s.step + '</span><span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
        + '<b style="font-size:24px;padding:8px 0;"></b>'
        + '<div dir="rtl" style="font-size:16px;line-height:1.6;">' + (s.text||'') + '</div></div>';
      html += '</div></div></div>';
    } else {
      html += '<div class="mySlides fade"><div class="image"><div class="image-center">'
        + '<img src="./images/' + s.image + '" style="max-height:calc(100vh - 80px);width:auto;max-width:100%;">';
      if (s.box) html += '<div class="box" style="top:' + s.box.top + ';left:' + s.box.left + ';right:' + s.box.right + ';bottom:' + s.box.bottom + ';" onclick="nextSlide()"></div>';
      var ac2 = s.arrow && s.arrow !== 'none' ? ' ' + s.arrow : '';
      html += '<div class="text' + ac2 + '" style="' + buildTextPos(s.textPos) + 'position:absolute;width:' + (s.textWidth||'300px') + ';height:fit-content;">'
        + '<div style="text-align:right;"><span style="color:#f6a67e;font-weight:700;">' + s.step + '</span><span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
        + '<b style="font-size:24px;padding:8px 0;"></b>'
        + '<div dir="rtl" style="font-size:16px;line-height:1.6;">' + (s.text||'') + '</div></div>';
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

function getPersonalName() {
  var params = new URLSearchParams(window.location.search);
  var name = params.get('u');
  if (name) { localStorage.setItem('cursor_user_display', name); return name; }
  return localStorage.getItem('cursor_user_display') || '';
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

/* ═══ Slide Rendering ═══ */

function showSlide(idx) {
  E.idx = idx;
  if (typeof rememberSlide === 'function') rememberSlide();
  var s = E.data.slides[idx];
  var container = $('slideContainer');
  var noSlide = $('noSlide');
  var img = $('slideImg');
  var box = $('editorBox');
  var bubble = $('editorBubble');

  updateInfo();
  updateStrip();

  if (s.image) {
    noSlide.style.display = 'none';
    container.style.display = 'inline-block';
    img.src = getImageUrl(s.image);
    img.onload = function() {
      renderBox(s);
      renderBubble(s);
    };
  } else if (s.html || s.type === 'special') {
    // Special slide - render in iframe
    box.style.display = 'none';
    bubble.style.display = 'none';
    container.style.display = 'none';
    noSlide.style.display = 'block';
    var iframeHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="preload" href="/assets/fonts/rubik-hebrew-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/rubik-hebrew-700-normal.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:Rubik;font-display:swap;font-weight:400;src:url(/assets/fonts/rubik-hebrew-400-normal.woff2) format(woff2)}@font-face{font-family:Rubik;font-display:swap;font-weight:700;src:url(/assets/fonts/rubik-hebrew-700-normal.woff2) format(woff2)}@font-face{font-family:Rubik;font-display:swap;font-weight:800;src:url(/assets/fonts/rubik-hebrew-800-normal.woff2) format(woff2)}@font-face{font-family:Rubik;font-display:swap;font-weight:400;src:url(/assets/fonts/rubik-latin-400-normal.woff2) format(woff2);unicode-range:U+0000-00FF}@font-face{font-family:Rubik;font-display:swap;font-weight:700;src:url(/assets/fonts/rubik-latin-700-normal.woff2) format(woff2);unicode-range:U+0000-00FF}*{font-family:Rubik,sans-serif}</style></head><body style="margin:0;overflow:hidden;">' + (s.html || '') + '</body></html>';
    noSlide.innerHTML = '<iframe class="special-iframe" srcdoc="' + iframeHtml.replace(/"/g, '&quot;') + '"></iframe>';
  } else {
    container.style.display = 'none';
    box.style.display = 'none';
    bubble.style.display = 'none';
    noSlide.style.display = 'block';
    noSlide.innerHTML = '<div style="color:#f6a67e;font-size:13px;">שקף ריק</div>';
  }

  updatePanel(s);
}

function renderBox(slide) {
  var box = $('editorBox');
  if (!slide.box) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.style.top = slide.box.top;
  box.style.left = slide.box.left;
  box.style.right = slide.box.right;
  box.style.bottom = slide.box.bottom;
  if (slide.type === 'view') { box.classList.add('view-box'); } else { box.classList.remove('view-box'); }
}

function renderBubble(slide) {
  var bubble = $('editorBubble');
  if (!slide.textPos || !slide.text) { bubble.style.display = 'none'; return; }
  bubble.style.display = 'flex';

  bubble.style.left = '';
  bubble.style.top = '';
  bubble.style.right = '';
  bubble.style.bottom = '';

  var cw = $('slideContainer').offsetWidth || 1;
  var ch = $('slideContainer').offsetHeight || 1;

  // Width in pixels — text doesn't reflow
  bubble.style.width = slide.textWidth || '300px';
  bubble.style.maxWidth = slide.textWidth || '300px';

  // Scale bubble same as live tutorial: containerWidth / designWidth
  var designW = window.bubbleDesignWidth || 853;
  var scale = cw / designW;
  bubble.style.transform = 'scale(' + scale + ')';
  bubble.style.transformOrigin = 'left top';

  var tp = slide.textPos;

  // Auto-convert calc() to pure %
  if (tp.left && /calc\(/.test(tp.left)) {
    tp.left = calcToPercent(tp.left, cw);
    markModified();
  }
  if (tp.top && /calc\(/.test(tp.top)) {
    tp.top = calcToPercent(tp.top, ch);
    markModified();
  }
  if (tp.bottom && /calc\(/.test(tp.bottom)) {
    tp.bottom = calcToPercent(tp.bottom, ch);
    markModified();
  }

  if (tp.left) bubble.style.left = tp.left;
  if (tp.top) bubble.style.top = tp.top;
  if (tp.bottom) {
    bubble.style.top = '';
    bubble.style.bottom = tp.bottom;
  }

  // Step counter + spacer — matches tutorial .text layout exactly
  var stepHtml = '';
  if (slide.step) {
    var totalSteps = E.data.totalSteps || 32;
    stepHtml = '<div style="text-align:right;font-size:12px;font-weight:700;margin-bottom:6px;letter-spacing:1px;">'
      + '<span style="color:#f6a67e;font-weight:700;">' + slide.step + '</span>'
      + '<span style="color:#ffffffbb;display:inline;">/' + totalSteps + '</span></div>'
      + '<b style="font-size:24px;padding:8px 0;"></b>';
  }
  $('bubblePreview').innerHTML = stepHtml + '<div dir="rtl" style="font-size:16px;line-height:1.6;">' + (slide.text || '') + '</div>';
}

// Re-scale bubble on window resize
window.addEventListener('resize', function() {
  var bubble = $('editorBubble');
  if (!bubble || !E.bubbleRefWidth || bubble.style.display === 'none') return;
  var cw = $('slideContainer').offsetWidth || 1;
  bubble.style.transform = 'scale(' + (cw / E.bubbleRefWidth) + ')';
});

// Convert calc(X% ± Npx) to pure percentage
function calcToPercent(val, containerPx) {
  if (!val) return val;
  val = val.trim();
  if (/^[\d.]+%$/.test(val)) return val;
  var m = val.match(/calc\(\s*([\d.]+)%\s*([+-])\s*([\d.]+)px\s*\)/);
  if (m) {
    var pct = parseFloat(m[1]);
    var op = m[2];
    var px = parseFloat(m[3]);
    var pxAsPct = (px / containerPx) * 100;
    return ((op === '+') ? pct + pxAsPct : pct - pxAsPct) + '%';
  }
  return val;
}

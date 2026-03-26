/* ═══ Slide Rendering ═══ */

function showSlide(idx) {
  E.idx = idx;
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
  } else {
    container.style.display = 'none';
    box.style.display = 'none';
    bubble.style.display = 'none';
    noSlide.style.display = 'block';
    noSlide.innerHTML = '<div style="color:#f6a67e;font-size:13px;">שקף מיוחד</div>'
      + '<div style="color:#ffffff55;font-size:12px;margin-top:6px;">'
      + (s.type || s.specialType || 'html') + '</div>';
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

  // Scale bubble proportionally on window resize (scale=1 on first load)
  if (!E.bubbleRefWidth) E.bubbleRefWidth = cw;
  var scale = cw / E.bubbleRefWidth;
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
  var continueHtml = slide.continueBtn ? '<div style="margin-top:10px;"><a style="display:inline-block;cursor:pointer;width:150px;height:32px;background:linear-gradient(135deg,#1a2540,#3d5a80);border-radius:20px;text-align:center;color:white;line-height:32px;font-size:14px;font-weight:600;">המשך</a></div>' : '';
  $('bubblePreview').innerHTML = stepHtml + '<div dir="rtl" style="font-size:16px;line-height:1.6;">' + (slide.text || '') + '</div>' + continueHtml;
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

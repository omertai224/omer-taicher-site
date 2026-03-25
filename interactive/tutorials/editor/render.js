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

  // Image slide?
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

  var container = $('slideContainer');
  var img = $('slideImg');
  var cw = container.offsetWidth || 1;
  var ch = container.offsetHeight || 1;
  var naturalW = img.naturalWidth || cw;
  var scale = cw / naturalW;

  // Convert old pixel widths to "natural-space" pixels.
  // Natural-space = the width at the image's natural resolution.
  // Example: 227px in editor (1200px container) on a 1920px image
  //   → naturalPx = 227 / (1200/1920) = 363px
  //   → visual in editor: 363 * 0.625 = 227px (same!)
  //   → visual in tutorial: 363 * 0.833 = 302px (proportional!)
  var tw = slide.textWidth || '300px';
  if (/^\d+(\.\d+)?px$/.test(tw) && scale < 0.95) {
    var oldPx = parseFloat(tw);
    var naturalPx = Math.round(oldPx / scale);
    tw = naturalPx + 'px';
    slide.textWidth = tw;
    markModified();
  }
  bubble.style.width = tw;
  bubble.style.maxWidth = tw;

  // Scale everything proportionally: text + padding + border.
  // Both editor and tutorial use naturalWidth as reference,
  // so bubbles are the same PROPORTION of the image in both.
  bubble.style.transform = 'scale(' + scale + ')';
  bubble.style.transformOrigin = 'left top';

  var tp = slide.textPos;

  // Auto-convert calc() to pure %
  if (tp.left && /calc\(/.test(tp.left)) {
    tp.left = calcToPercent(tp.left, naturalW);
    markModified();
  }
  if (tp.top && /calc\(/.test(tp.top)) {
    tp.top = calcToPercent(tp.top, img.naturalHeight || ch);
    markModified();
  }
  if (tp.bottom && /calc\(/.test(tp.bottom)) {
    tp.bottom = calcToPercent(tp.bottom, img.naturalHeight || ch);
    markModified();
  }

  if (tp.left) bubble.style.left = tp.left;
  if (tp.top) bubble.style.top = tp.top;
  if (tp.bottom) {
    bubble.style.top = '';
    bubble.style.bottom = tp.bottom;
  }

  // Step counter + bold spacer — MUST match tutorial rendering exactly!
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
  var container = $('slideContainer');
  var img = $('slideImg');
  if (!bubble || !container || !img || bubble.style.display === 'none') return;
  var naturalW = img.naturalWidth || 1;
  if (!naturalW) return;
  var cw = container.offsetWidth || 1;
  var scale = cw / naturalW;
  bubble.style.transform = 'scale(' + scale + ')';
});

// Convert "calc(50% - 315px)" to pure percentage based on container size
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
    var result = (op === '+') ? pct + pxAsPct : pct - pxAsPct;
    return result + '%';
  }
  return val;
}

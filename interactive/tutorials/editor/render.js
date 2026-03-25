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

  // Simple pixel width — readable text, resizable, no transform tricks
  bubble.style.width = slide.textWidth || '300px';
  bubble.style.maxWidth = slide.textWidth || '300px';
  bubble.style.transform = '';

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
      + '<b style="font-size:24px;padding:8px 0;display:block;"></b>';
  }
  $('bubblePreview').innerHTML = stepHtml + '<div dir="rtl" style="font-size:16px;line-height:1.6;">' + (slide.text || '') + '</div>';
}

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

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

  // Apply saved width if exists
  if (slide.textWidth) {
    bubble.style.width = slide.textWidth;
    bubble.style.maxWidth = slide.textWidth;
  } else {
    bubble.style.width = '';
    bubble.style.maxWidth = '300px';
  }

  var tp = slide.textPos;
  var img = $('slideImg');
  // Use NATURAL image size for calc conversion (matches tutorial rendering)
  var w = img.naturalWidth || img.offsetWidth || 1;
  var h = img.naturalHeight || img.offsetHeight || 1;

  // Convert calc() expressions to pure percentages
  if (tp.left) bubble.style.left = calcToPercent(tp.left, w);
  if (tp.top) bubble.style.top = calcToPercent(tp.top, h);
  if (tp.bottom) bubble.style.bottom = calcToPercent(tp.bottom, h);

  $('bubblePreview').innerHTML = slide.text || '';
}

// Convert "calc(50% - 315px)" to pure percentage based on container size
// If already pure % like "35.5%", return as-is
function calcToPercent(val, containerPx) {
  if (!val) return val;
  val = val.trim();

  // Already a simple percentage
  if (/^[\d.]+%$/.test(val)) return val;

  // Parse calc(X% - Npx) or calc(X% + Npx)
  var m = val.match(/calc\(\s*([\d.]+)%\s*([+-])\s*([\d.]+)px\s*\)/);
  if (m) {
    var pct = parseFloat(m[1]);
    var op = m[2];
    var px = parseFloat(m[3]);
    var pxAsPct = (px / containerPx) * 100;
    var result = (op === '+') ? pct + pxAsPct : pct - pxAsPct;
    return result + '%';
  }

  // Fallback: return as-is
  return val;
}

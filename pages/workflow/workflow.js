var loaded = {};

function loadTab(tabName) {
  if (loaded[tabName]) return Promise.resolve();
  var container = document.getElementById('tab-' + tabName);
  return fetch(tabName + '.html')
    .then(function(resp) {
      if (!resp.ok) throw new Error(resp.status);
      return resp.text();
    })
    .then(function(html) {
      container.innerHTML = html;
      loaded[tabName] = true;
    })
    .catch(function() {
      container.innerHTML = '<div class="section"><p style="color:#c62828;">שגיאה בטעינת הטאב. נסה לרענן.</p></div>';
    });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  var btn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
  if (btn) {
    btn.classList.add('active');
    var tabEl = document.getElementById('tab-' + tabName);
    tabEl.classList.add('active');
    loadTab(tabName);
    history.replaceState(null, '', '#' + tabName);
  }
}

document.querySelectorAll('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { switchTab(btn.dataset.tab); });
});

// Load initial tab
var hash = location.hash.replace('#', '');
var initialTab = (hash && document.getElementById('tab-' + hash)) ? hash : 'workflow';
switchTab(initialTab);

function copyTab(tabId) {
  var el = document.getElementById('tab-' + tabId);
  var text = el.innerText
    .replace(/הורד כטקסט\n?/g, '')
    .replace(/העתק ללוח\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  navigator.clipboard.writeText(text).then(function() {
    var btn = el.querySelector('.copy-btn');
    var orig = btn.innerHTML;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> הועתק!';
    btn.style.background = 'var(--navy)';
    btn.style.color = '#fff';
    setTimeout(function() { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; }, 2000);
  });
}

function downloadTab(tabId) {
  var el = document.getElementById('tab-' + tabId);
  var names = { workflow: 'תהליך-עבודה', posts: 'נוסחת-על-פוסטים', interactive: 'נוסחת-על-הדרכות', payments: 'מוצרים-ותשלומים', sitemap: 'מבנה-האתר', calls: 'ניתוח-שיחות' };
  var text = el.innerText
    .replace(/הורד כטקסט\n?/g, '')
    .replace(/העתק ללוח\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (names[tabId] || tabId) + '.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}

var loaded = {};
var subLoaded = {};

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
      // If this tab has sub-tabs, initialize them
      if (tabName === 'ideas') initSubTabs();
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
var initialTab = (hash && document.getElementById('tab-' + hash)) ? hash : 'ideas';
switchTab(initialTab);

// --- Sub-tabs for ideas ---
function loadSubTab(name) {
  if (subLoaded[name]) return Promise.resolve();
  var container = document.getElementById('subtab-' + name);
  return fetch('ideas/' + name + '.html')
    .then(function(resp) {
      if (!resp.ok) throw new Error(resp.status);
      return resp.text();
    })
    .then(function(html) {
      container.innerHTML = html;
      subLoaded[name] = true;
    })
    .catch(function() {
      container.innerHTML = '<div class="section"><p style="color:#c62828;">שגיאה בטעינה. נסה לרענן.</p></div>';
    });
}

function switchSubTab(name) {
  var parent = document.getElementById('tab-ideas');
  parent.querySelectorAll('.sub-tab-btn').forEach(function(b) { b.classList.remove('active'); });
  parent.querySelectorAll('.sub-tab-content').forEach(function(c) { c.classList.remove('active'); });
  var btn = parent.querySelector('.sub-tab-btn[data-subtab="' + name + '"]');
  if (btn) {
    btn.classList.add('active');
    var el = document.getElementById('subtab-' + name);
    el.classList.add('active');
    loadSubTab(name);
  }
}

function initSubTabs() {
  var parent = document.getElementById('tab-ideas');
  parent.querySelectorAll('.sub-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { switchSubTab(btn.dataset.subtab); });
  });
  // Load first sub-tab
  switchSubTab('priorities');
}

// --- Idea Cards (Accordion + Search) ---
function toggleIdea(header) {
  var card = header.closest('.idea-card');
  card.classList.toggle('open');
}

function deleteIdea(btn, event) {
  event.stopPropagation();
  var card = btn.closest('.idea-card');
  if (confirm('למחוק את הרעיון הזה?')) {
    card.style.transition = 'opacity 0.3s, max-height 0.3s';
    card.style.opacity = '0';
    card.style.maxHeight = card.offsetHeight + 'px';
    setTimeout(function() {
      card.style.maxHeight = '0';
      card.style.overflow = 'hidden';
      card.style.padding = '0';
      card.style.margin = '0';
    }, 100);
    setTimeout(function() { card.remove(); }, 400);
  }
}

function filterIdeas() {
  var input = document.getElementById('ideas-search');
  if (!input) return;
  var query = input.value.trim().toLowerCase();
  var parent = document.getElementById('tab-ideas');
  var cards = parent.querySelectorAll('.idea-card');
  var visible = 0;
  cards.forEach(function(card) {
    var text = card.textContent.toLowerCase();
    var tags = (card.dataset.tags || '').toLowerCase();
    var match = !query || text.indexOf(query) !== -1 || tags.indexOf(query) !== -1;
    card.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  var counter = document.getElementById('ideas-count');
  if (counter) {
    counter.textContent = query ? visible + ' רעיונות נמצאו' : '';
  }
}

// --- Copy & Download ---
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
  var names = { workflow: 'תהליך-עבודה', posts: 'נוסחת-על-פוסטים', payments: 'מוצרים-ותשלומים', sitemap: 'מבנה-האתר', ideas: 'רעיונות-להמשך', calls: 'ניתוח-שיחות' };
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

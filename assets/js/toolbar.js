(function () {
  // נגישות רק בפרודקשן
  if (location.hostname !== 'omertai.net' && location.hostname !== 'www.omertai.net') return;

  const STORAGE_KEY = 'a11y_settings';
  const defaults = { scale: 1, contrast: false, monochrome: false, sepia: false, links: false, animations: false, cursor: false, spacing: false, dyslexia: false, ruler: false, invert: false, hideImages: false, focusHighlight: false };
  let settings = Object.assign({}, defaults);

  // טעינת הגדרות שמורות
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (saved) Object.assign(settings, saved); } catch(e) {}

  // ===== LOAD DYSLEXIA FONT =====
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap';
  document.head.appendChild(fontLink);

  // ===== STYLES =====
  const style = document.createElement('style');
  style.textContent = `
    .a11y-trigger {
      position: fixed;
      top: 72px;
      left: 16px;
      z-index: 9999;
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 2px solid rgba(246,166,126,0.6);
      background: rgba(26,74,107,0.95);
      backdrop-filter: blur(12px);
      color: #f6a67e;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      transition: transform 0.2s, box-shadow 0.2s;
      padding: 0;
    }
    .a11y-trigger:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
    .a11y-trigger.has-active { background: #e8854a; border-color: #e8854a; color: #fff; }

    .a11y-panel {
      position: fixed;
      top: 124px;
      left: 16px;
      z-index: 9998;
      width: 280px;
      max-height: calc(100vh - 140px);
      overflow-y: auto;
      background: rgba(26,74,107,0.97);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(246,166,126,0.4);
      border-radius: 20px;
      padding: 20px;
      direction: rtl;
      box-shadow: 0 12px 48px rgba(0,0,0,0.3);
      font-family: 'Rubik', sans-serif;
      display: none;
      animation: a11ySlideIn 0.2s ease;
    }
    .a11y-panel.open { display: block; }
    @keyframes a11ySlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .a11y-panel-title {
      font-size: 0.85rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .a11y-panel-title svg { color: #f6a67e; }

    .a11y-group {
      margin-bottom: 16px;
    }
    .a11y-group-label {
      font-size: 0.68rem;
      font-weight: 700;
      color: rgba(255,255,255,0.45);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .a11y-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .a11y-size-btns {
      display: flex;
      gap: 6px;
      width: 100%;
    }
    .a11y-size-btn {
      flex: 1;
      height: 40px;
      border-radius: 10px;
      border: 1px solid rgba(246,166,126,0.4);
      background: rgba(246,166,126,0.08);
      color: #f6a67e;
      font-family: 'Rubik', sans-serif;
      font-size: 0.85rem;
      font-weight: 800;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      display: flex; align-items: center; justify-content: center;
      padding: 0;
    }
    .a11y-size-btn:hover { background: rgba(246,166,126,0.2); }
    .a11y-size-btn:active { transform: scale(0.95); }
    .a11y-size-btn.reset-btn {
      color: rgba(255,255,255,0.5);
      border-color: rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      font-size: 0.75rem;
    }

    .a11y-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.04);
      cursor: pointer;
      transition: background 0.15s;
      margin-bottom: 6px;
    }
    .a11y-toggle:hover { background: rgba(255,255,255,0.08); }
    .a11y-toggle-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .a11y-toggle-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: rgba(246,166,126,0.1);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .a11y-toggle-icon svg { width: 16px; height: 16px; stroke: #f6a67e; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .a11y-toggle-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: rgba(255,255,255,0.85);
    }
    .a11y-toggle-switch {
      width: 36px; height: 20px;
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      position: relative;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .a11y-toggle-switch::after {
      content: '';
      position: absolute;
      top: 2px; right: 2px;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
      transition: transform 0.2s, background 0.2s;
    }
    .a11y-toggle.active .a11y-toggle-switch { background: #e8854a; }
    .a11y-toggle.active .a11y-toggle-switch::after { transform: translateX(-16px); background: #fff; }
    .a11y-toggle.active .a11y-toggle-icon { background: rgba(232,133,74,0.2); }

    .a11y-reset-all {
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.5);
      font-family: 'Rubik', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      margin-top: 12px;
    }
    .a11y-reset-all:hover { background: rgba(255,255,255,0.1); color: #fff; }

    .a11y-kbd {
      font-size: 0.62rem;
      color: rgba(255,255,255,0.25);
      text-align: center;
      margin-top: 10px;
    }

    /* Filter classes on html */
    html.a11y-contrast { filter: contrast(1.4); }
    html.a11y-monochrome { filter: grayscale(1); }
    html.a11y-sepia { filter: sepia(0.4); }
    html.a11y-contrast.a11y-monochrome { filter: contrast(1.4) grayscale(1); }
    html.a11y-contrast.a11y-sepia { filter: contrast(1.4) sepia(0.4); }

    html.a11y-links a { text-decoration: underline !important; outline: 2px solid #e8854a !important; outline-offset: 2px; }
    html.a11y-no-animations *, html.a11y-no-animations *::before, html.a11y-no-animations *::after {
      animation-duration: 0s !important; transition-duration: 0s !important;
    }
    html.a11y-cursor { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23e8854a' opacity='0.5'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%23e8854a'/%3E%3C/svg%3E") 16 16, auto !important; }
    html.a11y-cursor a, html.a11y-cursor button, html.a11y-cursor [role="button"] { cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23e8854a' opacity='0.5'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%23e8854a'/%3E%3C/svg%3E") 16 16, pointer !important; }
    html.a11y-spacing p, html.a11y-spacing li, html.a11y-spacing span, html.a11y-spacing div { letter-spacing: 0.05em !important; word-spacing: 0.1em !important; line-height: 2 !important; }

    /* Dyslexia-friendly font */
    html.a11y-dyslexia * { font-family: 'Lexend', Arial, sans-serif !important; }

    /* Invert colors */
    html.a11y-invert { filter: invert(1) hue-rotate(180deg); }
    html.a11y-invert img, html.a11y-invert video, html.a11y-invert svg { filter: invert(1) hue-rotate(180deg); }
    html.a11y-invert.a11y-contrast { filter: invert(1) hue-rotate(180deg) contrast(1.4); }
    html.a11y-invert.a11y-monochrome { filter: invert(1) hue-rotate(180deg) grayscale(1); }

    /* Hide images */
    html.a11y-hide-images img, html.a11y-hide-images svg:not(.a11y-panel svg):not(.a11y-trigger svg),
    html.a11y-hide-images video, html.a11y-hide-images [style*="background-image"] { opacity: 0.05 !important; }

    /* Focus highlight */
    html.a11y-focus-highlight *:focus { outline: 3px solid #e8854a !important; outline-offset: 3px !important; box-shadow: 0 0 0 6px rgba(232,133,74,0.3) !important; }
    html.a11y-focus-highlight *:focus-visible { outline: 3px solid #e8854a !important; outline-offset: 3px !important; box-shadow: 0 0 0 6px rgba(232,133,74,0.3) !important; }

    /* Reading ruler */
    .a11y-reading-ruler {
      position: fixed;
      left: 0; right: 0;
      height: 40px;
      z-index: 99999;
      pointer-events: none;
      border-top: 2px solid rgba(232,133,74,0.7);
      border-bottom: 2px solid rgba(232,133,74,0.7);
      background: rgba(232,133,74,0.08);
      transition: top 0.05s linear;
      display: none;
    }
    .a11y-reading-ruler.visible { display: block; }
  `;
  document.head.appendChild(style);

  // ===== TRIGGER BUTTON =====
  const trigger = document.createElement('button');
  trigger.className = 'a11y-trigger';
  trigger.setAttribute('aria-label', 'הגדרות נגישות');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M9 9h6l-1 6-2 5-2-5z"/><path d="M7 20l2-5"/><path d="M17 20l-2-5"/></svg>';
  document.body.appendChild(trigger);

  // ===== PANEL =====
  const panel = document.createElement('div');
  panel.className = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'הגדרות נגישות');
  panel.innerHTML = `
    <div class="a11y-panel-title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M9 9h6l-1 6-2 5-2-5z"/><path d="M7 20l2-5"/><path d="M17 20l-2-5"/></svg>
      הגדרות נגישות
    </div>

    <div class="a11y-group">
      <div class="a11y-group-label">גודל טקסט</div>
      <div class="a11y-size-btns">
        <button class="a11y-size-btn" data-action="down" aria-label="הקטן טקסט">א−</button>
        <button class="a11y-size-btn reset-btn" data-action="reset" aria-label="איפוס גודל">איפוס</button>
        <button class="a11y-size-btn" data-action="up" aria-label="הגדל טקסט">א+</button>
      </div>
    </div>

    <div class="a11y-group">
      <div class="a11y-group-label">תצוגה</div>
      <div class="a11y-toggle" data-key="contrast">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20V2z" fill="#f6a67e"/></svg></div>
          <span class="a11y-toggle-label">ניגודיות גבוהה</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="monochrome">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="12" x2="21" y2="12"/></svg></div>
          <span class="a11y-toggle-label">מונוכרום</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="sepia">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".5" fill="#f6a67e"/><circle cx="17.5" cy="10.5" r=".5" fill="#f6a67e"/><circle cx="8.5" cy="7.5" r=".5" fill="#f6a67e"/><circle cx="6.5" cy="12.5" r=".5" fill="#f6a67e"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg></div>
          <span class="a11y-toggle-label">ספיה</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
    </div>

    <div class="a11y-group">
      <div class="a11y-group-label">ניווט וקריאה</div>
      <div class="a11y-toggle" data-key="links">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></div>
          <span class="a11y-toggle-label">הדגשת קישורים</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="cursor">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg></div>
          <span class="a11y-toggle-label">סמן מוגדל</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="spacing">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg></div>
          <span class="a11y-toggle-label">ריווח שורות</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="animations">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg></div>
          <span class="a11y-toggle-label">ביטול אנימציות</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
    </div>

    <div class="a11y-group">
      <div class="a11y-group-label">כלים נוספים</div>
      <div class="a11y-toggle" data-key="dyslexia">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg></div>
          <span class="a11y-toggle-label">פונט דיסלקציה</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="ruler">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><rect x="1" y="8" width="22" height="8" rx="1" opacity="0.3" fill="#f6a67e"/></svg></div>
          <span class="a11y-toggle-label">סרגל קריאה</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="invert">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2v20" stroke="#f6a67e"/><path d="M12 2a10 10 0 000 20" fill="#f6a67e" opacity="0.5"/></svg></div>
          <span class="a11y-toggle-label">היפוך צבעים</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="hideImages">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#f6a67e"/><path d="M21 15l-5-5L5 21"/><line x1="2" y1="2" x2="22" y2="22" stroke-width="2.5"/></svg></div>
          <span class="a11y-toggle-label">הסתרת תמונות</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
      <div class="a11y-toggle" data-key="focusHighlight">
        <div class="a11y-toggle-info">
          <div class="a11y-toggle-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M1 12h4"/><path d="M19 12h4"/></svg></div>
          <span class="a11y-toggle-label">הדגשת פוקוס</span>
        </div>
        <div class="a11y-toggle-switch"></div>
      </div>
    </div>

    <button class="a11y-reset-all" id="a11y-reset-all">איפוס כל ההגדרות</button>
    <div class="a11y-kbd">Shift+A לפתיחה מהירה</div>
  `;
  document.body.appendChild(panel);

  // ===== LOGIC =====
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }

  function applyScale(s) {
    settings.scale = Math.min(1.5, Math.max(0.8, parseFloat(s.toFixed(1))));
    document.documentElement.style.fontSize = (settings.scale * 16) + 'px';
    save();
  }

  function applyToggles() {
    const html = document.documentElement;
    html.classList.toggle('a11y-contrast', settings.contrast);
    html.classList.toggle('a11y-monochrome', settings.monochrome);
    html.classList.toggle('a11y-sepia', settings.sepia);
    html.classList.toggle('a11y-links', settings.links);
    html.classList.toggle('a11y-no-animations', settings.animations);
    html.classList.toggle('a11y-cursor', settings.cursor);
    html.classList.toggle('a11y-spacing', settings.spacing);
    html.classList.toggle('a11y-dyslexia', settings.dyslexia);
    html.classList.toggle('a11y-invert', settings.invert);
    html.classList.toggle('a11y-hide-images', settings.hideImages);
    html.classList.toggle('a11y-focus-highlight', settings.focusHighlight);

    // Reading ruler
    if (rulerEl) rulerEl.classList.toggle('visible', settings.ruler);

    // עדכון UI
    panel.querySelectorAll('.a11y-toggle').forEach(function(el) {
      el.classList.toggle('active', !!settings[el.dataset.key]);
    });

    // כפתור trigger מציין אם יש הגדרות פעילות
    const hasActive = settings.contrast || settings.monochrome || settings.sepia || settings.links || settings.animations || settings.cursor || settings.spacing || settings.dyslexia || settings.ruler || settings.invert || settings.hideImages || settings.focusHighlight || settings.scale !== 1;
    trigger.classList.toggle('has-active', hasActive);

    save();
  }

  function resetAll() {
    Object.assign(settings, defaults);
    document.documentElement.style.fontSize = '';
    applyToggles();
  }

  // ===== READING RULER =====
  const rulerEl = document.createElement('div');
  rulerEl.className = 'a11y-reading-ruler';
  document.body.appendChild(rulerEl);

  document.addEventListener('mousemove', function(e) {
    if (settings.ruler) rulerEl.style.top = (e.clientY - 20) + 'px';
  });
  document.addEventListener('touchmove', function(e) {
    if (settings.ruler && e.touches[0]) rulerEl.style.top = (e.touches[0].clientY - 20) + 'px';
  }, { passive: true });

  // החל הגדרות בטעינה
  applyScale(settings.scale);
  applyToggles();

  // Toggle panel
  trigger.addEventListener('click', function() {
    const isOpen = panel.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
  });

  // סגירה בלחיצה מחוץ לפאנל
  document.addEventListener('click', function(e) {
    if (panel.classList.contains('open') && !panel.contains(e.target) && !trigger.contains(e.target)) {
      panel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Keyboard shortcut: Shift+A
  document.addEventListener('keydown', function(e) {
    if (e.shiftKey && e.key === 'A') {
      e.preventDefault();
      trigger.click();
    }
  });

  // Size buttons
  panel.querySelectorAll('.a11y-size-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var action = btn.dataset.action;
      if (action === 'up') applyScale(settings.scale + 0.1);
      else if (action === 'down') applyScale(settings.scale - 0.1);
      else applyScale(1);
      applyToggles();
    });
  });

  // Toggle buttons
  panel.querySelectorAll('.a11y-toggle').forEach(function(el) {
    el.addEventListener('click', function() {
      settings[el.dataset.key] = !settings[el.dataset.key];
      applyToggles();
    });
  });

  // Reset
  panel.querySelector('#a11y-reset-all').addEventListener('click', resetAll);
})();

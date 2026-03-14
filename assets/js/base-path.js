/*  base-path.js — GitHub Pages base-path fix
    On GitHub Pages the site lives under /omer-taicher-site/
    while on production (omertai.net) it lives at /.
    This script rewrites internal links and patches fetch()
    so everything works in both environments.              */

(function () {
  var match = location.pathname.match(/^(\/omer-taicher-site)\b/);
  if (!match) return;                    // production — nothing to do

  var BASE = match[1];                   // "/omer-taicher-site"

  // 1. Rewrite <a href="/..."> links
  function rewriteLinks(root) {
    (root || document).querySelectorAll('a[href^="/"]').forEach(function (a) {
      var raw = a.getAttribute('href');   // keep the raw attribute, not resolved
      if (raw && raw.charAt(0) === '/' && !raw.startsWith(BASE)) {
        a.setAttribute('href', BASE + raw);
      }
    });
  }

  // run once now (for anything already in the DOM)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { rewriteLinks(); });
  } else {
    rewriteLinks();
  }

  // observe future DOM changes (cards injected by JS, etc.)
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) rewriteLinks(node.parentElement || node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  // 2. Patch fetch() so fetch('/blog/posts.json') also gets the prefix
  var _fetch = window.fetch;
  window.fetch = function (url, opts) {
    if (typeof url === 'string' && url.charAt(0) === '/' && !url.startsWith(BASE)) {
      url = BASE + url;
    }
    return _fetch.call(this, url, opts);
  };
})();

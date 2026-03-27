(function(){
  var root = document.getElementById('nav-root');
  if (!root) return;
  fetch('/assets/nav.html')
    .then(function(r) { return r.text(); })
    .then(function(html) {
      root.innerHTML = html;
      var scripts = root.querySelectorAll('script');
      scripts.forEach(function(s) {
        var ns = document.createElement('script');
        ns.textContent = s.textContent;
        s.parentNode.replaceChild(ns, s);
      });
    })
    .catch(function() {});
})();

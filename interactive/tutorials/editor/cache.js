/* ═══ Cache: persist tutorial data across page refresh ═══ */

var CACHE_DB = 'editor-cache';
var CACHE_VER = 1;

function openCacheDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(CACHE_DB, CACHE_VER);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('data')) db.createObjectStore('data');
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function() { reject(req.error); };
  });
}

// Save tutorial to IndexedDB
function cacheTutorial(name, slidesJson, imageFiles) {
  // Step 1: read ALL images to data URLs
  var imgData = {};
  var promises = [];
  var count = 0;

  for (var imgName in imageFiles) {
    count++;
    (function(n, file) {
      var p = new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function() {
          imgData[n] = reader.result;
          resolve();
        };
        reader.onerror = function() { resolve(); };
        reader.readAsDataURL(file);
      });
      promises.push(p);
    })(imgName, imageFiles[imgName]);
  }

  toast('שומר ' + count + ' תמונות...');

  // Step 2: save everything to IndexedDB
  Promise.all(promises).then(function() {
    toast('תמונות נקראו. שומר ל-cache...');
    return openCacheDB();
  }).then(function(db) {
    var tx = db.transaction('data', 'readwrite');
    var store = tx.objectStore('data');
    store.put(name, 'name');
    store.put(JSON.stringify(slidesJson), 'slides');
    store.put(imgData, 'images');
    tx.oncomplete = function() {
      toast('נשמר! ' + Object.keys(imgData).length + ' תמונות. רענון יטען אוטומטית');
    };
    tx.onerror = function(e) {
      toast('שגיאת שמירה: ' + (e.target.error || 'unknown'));
    };
  }).catch(function(err) {
    toast('שגיאת cache: ' + err.message);
  });
}

// Load cached tutorial
function loadFromCache() {
  return openCacheDB().then(function(db) {
    return new Promise(function(resolve) {
      var tx = db.transaction('data', 'readonly');
      var store = tx.objectStore('data');
      var nameReq = store.get('name');
      var slidesReq = store.get('slides');
      var imagesReq = store.get('images');

      tx.oncomplete = function() {
        if (!nameReq.result || !slidesReq.result) {
          resolve(null);
          return;
        }
        var imgs = imagesReq.result || {};
        resolve({
          name: nameReq.result,
          slides: JSON.parse(slidesReq.result),
          images: imgs
        });
      };
      tx.onerror = function() { resolve(null); };
    });
  }).catch(function() { return null; });
}

// Clear cache
function clearCache() {
  openCacheDB().then(function(db) {
    var tx = db.transaction('data', 'readwrite');
    tx.objectStore('data').clear();
  }).catch(function() {});
}

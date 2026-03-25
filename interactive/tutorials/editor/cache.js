/* ═══ Cache: persist ALL tutorials across page refresh ═══ */

var CACHE_DB = 'editor-cache';
var CACHE_VER = 2; // bumped: new structure with multiple tutorials

function openCacheDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(CACHE_DB, CACHE_VER);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      // Clear old stores from v1
      if (db.objectStoreNames.contains('data')) db.deleteObjectStore('data');
      if (!db.objectStoreNames.contains('tutorials')) db.createObjectStore('tutorials');
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
    };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function() { reject(req.error); };
  });
}

// Save one tutorial (called each time a tutorial is loaded)
function cacheTutorial(name, slidesJson, imageFiles) {
  var imgData = {};
  var promises = [];
  var count = 0;

  for (var imgName in imageFiles) {
    count++;
    (function(n, file) {
      promises.push(new Promise(function(resolve) {
        var reader = new FileReader();
        reader.onload = function() { imgData[n] = reader.result; resolve(); };
        reader.onerror = function() { resolve(); };
        reader.readAsDataURL(file);
      }));
    })(imgName, imageFiles[imgName]);
  }

  Promise.all(promises).then(function() {
    return openCacheDB();
  }).then(function(db) {
    // Save tutorial data
    var tx = db.transaction(['tutorials', 'meta'], 'readwrite');
    tx.objectStore('tutorials').put({
      slides: JSON.stringify(slidesJson),
      images: imgData
    }, name);

    // Update names list + last viewed
    var metaStore = tx.objectStore('meta');
    var namesReq = metaStore.get('names');
    namesReq.onsuccess = function() {
      var names = namesReq.result || [];
      if (names.indexOf(name) === -1) names.push(name);
      names.sort();
      metaStore.put(names, 'names');
      metaStore.put(name, 'last');
    };

    tx.oncomplete = function() {
      toast('נשמר! ' + count + ' תמונות');
    };
    tx.onerror = function() {
      toast('שגיאת שמירה');
    };
  }).catch(function(err) {
    toast('שגיאת cache: ' + err.message);
  });
}

// Load all cached tutorial names + last viewed
function loadFromCache() {
  return openCacheDB().then(function(db) {
    return new Promise(function(resolve) {
      var tx = db.transaction('meta', 'readonly');
      var store = tx.objectStore('meta');
      var namesReq = store.get('names');
      var lastReq = store.get('last');

      tx.oncomplete = function() {
        if (!namesReq.result || namesReq.result.length === 0) {
          resolve(null);
          return;
        }
        resolve({
          names: namesReq.result,
          last: lastReq.result || namesReq.result[0]
        });
      };
      tx.onerror = function() { resolve(null); };
    });
  }).catch(function() { return null; });
}

// Load one specific tutorial from cache
function loadCachedTutorial(name) {
  return openCacheDB().then(function(db) {
    return new Promise(function(resolve) {
      var tx = db.transaction(['tutorials', 'meta'], 'readwrite');
      var req = tx.objectStore('tutorials').get(name);
      // Update last viewed
      tx.objectStore('meta').put(name, 'last');

      tx.oncomplete = function() {
        if (!req.result) { resolve(null); return; }
        resolve({
          name: name,
          slides: JSON.parse(req.result.slides),
          images: req.result.images || {}
        });
      };
      tx.onerror = function() { resolve(null); };
    });
  }).catch(function() { return null; });
}

// Clear cache
function clearCache() {
  openCacheDB().then(function(db) {
    var tx = db.transaction(['tutorials', 'meta'], 'readwrite');
    tx.objectStore('tutorials').clear();
    tx.objectStore('meta').clear();
  }).catch(function() {});
}

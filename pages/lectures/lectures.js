// YouTube iframe API
var ytPlayers = {};
var ytReady = false;

// Load YouTube API
var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);

function onYouTubeIframeAPIReady() { ytReady = true; }

function timeToSeconds(t) {
  var parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  return parts[0]*60 + parts[1];
}

function seekTo(lecIndex, seconds) {
  var player = ytPlayers[lecIndex];
  var wrap = document.querySelector('#lec-card-' + lecIndex + ' .lec-thumb-wrap');

  if (!player) {
    // First click: create player and seek
    var lec = lecturesData[lecIndex];
    wrap.innerHTML = '<div id="yt-player-' + lecIndex + '"></div>';
    ytPlayers[lecIndex] = new YT.Player('yt-player-' + lecIndex, {
      videoId: lec.ytId,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, rel: 0, start: seconds, cc_load_policy: 1, cc_lang_pref: 'iw' },
      events: {
        onReady: function(e) {
          e.target.seekTo(seconds, true);
          e.target.playVideo();
        }
      }
    });
    // Style the iframe container
    var iframe = wrap.querySelector('iframe');
    if (iframe) {
      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
    }
  } else {
    // Player exists: just seek
    player.seekTo(seconds, true);
    player.playVideo();
  }

  // Scroll to video
  wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderLectures() {
  var container = document.getElementById('lectures-list');
  if (!container || !lecturesData) return;

  lecturesData.forEach(function(lec, i) {
    var thumb = 'https://img.youtube.com/vi/' + lec.ytId + '/maxresdefault.jpg';
    var ytUrl = 'https://www.youtube.com/watch?v=' + lec.ytId + '&cc_load_policy=1&cc_lang_pref=iw';

    // Topics chips
    var topicsHTML = lec.topics.map(function(t) {
      return '<span class="lec-topic">' + t + '</span>';
    }).join('');

    // Chapters as inline tags (with optional dropdown for sub-chapters)
    var chaptersHTML = lec.chapters.map(function(ch) {
      var secs = timeToSeconds(ch.time);
      if (ch.sub) {
        var subHTML = ch.sub.map(function(s) {
          var ss = timeToSeconds(s.time);
          return '<button class="lec-sub-tag" onclick="seekTo(' + i + ',' + ss + ');event.stopPropagation();">' +
            '<span class="lec-tag-time">' + s.time + '</span> ' + s.label +
          '</button>';
        }).join('');
        return '<div class="lec-chapter-dropdown">' +
          '<button class="lec-chapter-tag lec-has-sub" onclick="this.parentElement.classList.toggle(\'open\')">' +
            '<span class="lec-tag-time">' + ch.time + '</span> ' + ch.label +
            ' <svg class="lec-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>' +
          '</button>' +
          '<div class="lec-sub-menu">' + subHTML + '</div>' +
        '</div>';
      }
      return '<button class="lec-chapter-tag" onclick="seekTo(' + i + ',' + secs + ')">' +
        '<span class="lec-tag-time">' + ch.time + '</span> ' + ch.label +
      '</button>';
    }).join('');

    // CTA
    var ctaHTML = '';
    if (lec.cta) {
      ctaHTML = '<a class="lec-cta" href="' + lec.cta.url + '" target="_blank" rel="noopener">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
        lec.cta.text +
      '</a>';
    }

    var card = document.createElement('div');
    card.className = 'lec-card';
    card.id = 'lec-card-' + i;
    card.innerHTML =
      '<div class="lec-thumb-wrap">' +
        '<img class="lec-thumb" src="' + thumb + '" alt="' + lec.title + '" loading="lazy">' +
        '<button class="lec-play" data-index="' + i + '" aria-label="צפה בהרצאה">' +
          '<svg width="48" height="48" viewBox="0 0 68 48"><path d="M66.5 7.7s-.7-4.7-2.7-6.8C61 -1.7 58-.1 56.4-.3 47.1-1 34 -1 34-1S20.9-1 11.6-.3C10-.1 7-1.7 4.2.9 2.2 3 1.5 7.7 1.5 7.7S.8 13.2.8 18.7v5.1c0 5.5.7 11 .7 11s.7 4.7 2.7 6.8C7 44.2 10.4 44.1 12.2 44.4 18.4 45 34 45 34 45s13.1 0 22.4-.7c1.6-.2 4.6-1.4 7.4-4C66.5 37.7 67.2 33 67.2 33s.7-5.5.7-11v-5.1c0-5.5-.7-11-.7-11z" fill="red"/><path d="M27 33V14l18.4 9.5L27 33z" fill="#fff"/></svg>' +
        '</button>' +
        '<div class="lec-duration">' + lec.duration + '</div>' +
      '</div>' +
      '<div class="lec-chapter-tags">' + chaptersHTML + '</div>' +
      '<div class="lec-body">' +
        '<div class="lec-date">' + lec.date + '</div>' +
        '<h3 class="lec-title">' + lec.title + '</h3>' +
        '<p class="lec-desc">' + lec.desc + '</p>' +
        '<div class="lec-topics">' + topicsHTML + '</div>' +
        '<div class="lec-actions">' +
          '<a class="lec-yt-btn" href="' + ytUrl + '" target="_blank" rel="noopener">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2s-.2-1.7-1-2.4c-.9-1-1.9-1-2.4-1C16.8 2.5 12 2.5 12 2.5s-4.8 0-8.1.3c-.5 0-1.5 0-2.4 1-.7.7-1 2.4-1 2.4S.2 8.2.2 10.1v1.8c0 2 .3 3.9.3 3.9s.2 1.7 1 2.4c.9 1 2.1.9 2.6 1 1.9.2 8 .3 8 .3s4.8 0 8.1-.3c.5 0 1.5 0 2.4-1 .7-.7 1-2.4 1-2.4s.3-2 .3-3.9v-1.8c0-2-.3-3.9-.3-3.9zM9.5 15.1V8.4l6.5 3.4-6.5 3.4z"/></svg>' +
            'צפה ביוטיוב' +
          '</a>' +
          ctaHTML +
        '</div>' +
      '</div>';

    container.appendChild(card);
  });

  // Play buttons - create YouTube player
  document.querySelectorAll('.lec-play').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.getAttribute('data-index'));
      seekTo(idx, 0);
    });
  });
}

function injectSchemaOrg() {
  if (!lecturesData || !lecturesData.length) return;

  // Parse "DD.MM.YY" to ISO date string
  function parseDate(d) {
    var p = d.split('.');
    var year = parseInt(p[2]) + 2000;
    return year + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0');
  }

  // Parse "~45 דקות" to ISO 8601 duration "PT45M"
  function parseDuration(dur) {
    var m = dur.match(/(\d+)/);
    return m ? 'PT' + m[1] + 'M' : 'PT60M';
  }

  var author = {
    '@type': 'Person',
    'name': 'עומר טייכר',
    'url': 'https://omertai.net',
    'jobTitle': 'טכנאי ומדריך מחשבים',
    'sameAs': [
      'https://www.youtube.com/@omertai'
    ]
  };

  var videoObjects = lecturesData.map(function(lec, i) {
    var isoDate = parseDate(lec.date);
    return {
      '@type': 'VideoObject',
      'name': lec.title + ' - מיומנו של טכנאי מחשבים',
      'description': lec.desc,
      'thumbnailUrl': 'https://img.youtube.com/vi/' + lec.ytId + '/maxresdefault.jpg',
      'uploadDate': isoDate,
      'duration': parseDuration(lec.duration),
      'contentUrl': 'https://www.youtube.com/watch?v=' + lec.ytId,
      'embedUrl': 'https://www.youtube.com/embed/' + lec.ytId,
      'author': author,
      'publisher': author,
      'inLanguage': 'he',
      'isAccessibleForFree': true,
      'keywords': lec.topics.join(', '),
      'position': i + 1
    };
  });

  // ItemList schema listing all lectures
  var itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'מיומנו של טכנאי מחשבים - כל ההרצאות',
    'description': 'הרצאות Zoom חינמיות על מחשבים, תוכנות וטכנולוגיה. הדגמות חיות, כלים שימושיים ושאלות בשידור חי.',
    'numberOfItems': lecturesData.length,
    'itemListElement': videoObjects.map(function(video, i) {
      return {
        '@type': 'ListItem',
        'position': i + 1,
        'item': video
      };
    })
  };

  // Person schema for the author
  var personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'עומר טייכר',
    'url': 'https://omertai.net',
    'jobTitle': 'טכנאי ומדריך מחשבים',
    'sameAs': [
      'https://www.youtube.com/@omertai'
    ]
  };

  // Inject both schemas as JSON-LD
  var schemas = [itemList, personSchema];
  schemas.forEach(function(schema) {
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderLectures();
  injectSchemaOrg();
});

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.lec-chapter-dropdown')) {
    document.querySelectorAll('.lec-chapter-dropdown.open').forEach(function(d) {
      d.classList.remove('open');
    });
  }
});

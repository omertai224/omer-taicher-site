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
      playerVars: { autoplay: 1, rel: 0, start: seconds },
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
    var ytUrl = 'https://youtu.be/' + lec.ytId;

    // Topics chips
    var topicsHTML = lec.topics.map(function(t) {
      return '<span class="lec-topic">' + t + '</span>';
    }).join('');

    // Chapters as buttons (seek inside embedded player)
    var chaptersHTML = lec.chapters.map(function(ch) {
      var secs = timeToSeconds(ch.time);
      return '<button class="lec-chapter" onclick="seekTo(' + i + ',' + secs + ')">' +
        '<span class="lec-chapter-time">' + ch.time + '</span>' +
        '<span class="lec-chapter-label">' + ch.label + '</span>' +
        '<svg class="lec-chapter-play" width="12" height="12" viewBox="0 0 24 24" fill="var(--orange-deep)" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
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
      '<div class="lec-body">' +
        '<div class="lec-date">' + lec.date + '</div>' +
        '<h3 class="lec-title">' + lec.title + '</h3>' +
        '<p class="lec-desc">' + lec.desc + '</p>' +
        '<div class="lec-topics">' + topicsHTML + '</div>' +
        '<button class="lec-chapters-toggle" data-index="' + i + '">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>' +
          'פרקי זמן (' + lec.chapters.length + ')' +
          '<svg class="lec-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>' +
        '</button>' +
        '<div class="lec-chapters" id="chapters-' + i + '">' + chaptersHTML + '</div>' +
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

  // Chapter toggles
  document.querySelectorAll('.lec-chapters-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = this.getAttribute('data-index');
      var panel = document.getElementById('chapters-' + idx);
      panel.classList.toggle('open');
      this.classList.toggle('open');
    });
  });

  // Play buttons - create YouTube player
  document.querySelectorAll('.lec-play').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = parseInt(this.getAttribute('data-index'));
      seekTo(idx, 0);
    });
  });
}

document.addEventListener('DOMContentLoaded', renderLectures);

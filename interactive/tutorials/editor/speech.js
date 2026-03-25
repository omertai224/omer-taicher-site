/* ═══ Speech-to-Text: record button for text fields ═══ */

var _recognition = null;
var _speechTarget = null; // 'text' or note index
var _speechActive = false;

function initSpeech() {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return; // browser doesn't support

  _recognition = new SR();
  _recognition.lang = 'he-IL';
  _recognition.continuous = true;
  _recognition.interimResults = true;

  _recognition.onresult = function(e) {
    var final = '';
    var interim = '';
    for (var i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        final += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }

    if (_speechTarget === 'text') {
      // Append to bubble text editor
      if (final) {
        var editor = $('pText');
        editor.innerHTML += final;
        applyText();
      }
    } else if (typeof _speechTarget === 'number') {
      // Append to note input
      var input = document.querySelectorAll('.note-input')[_speechTarget];
      if (input && final) {
        input.value += final;
        updateNoteText(_speechTarget, input.value);
      }
    }
  };

  _recognition.onerror = function(e) {
    if (e.error !== 'no-speech') toast('שגיאת הקלטה: ' + e.error);
    stopSpeech();
  };

  _recognition.onend = function() {
    if (_speechActive) {
      // Restart if still active (Chrome stops after silence)
      try { _recognition.start(); } catch(e) {}
    }
  };
}

function toggleSpeech(target) {
  if (!_recognition) {
    toast('הדפדפן לא תומך בהקלטה');
    return;
  }

  if (_speechActive) {
    stopSpeech();
    return;
  }

  _speechTarget = target;
  _speechActive = true;
  try {
    _recognition.start();
  } catch(e) {
    _recognition.stop();
    setTimeout(function() { _recognition.start(); }, 100);
  }
  updateMicButtons();
  toast('מקליט... דברו בעברית');
}

function stopSpeech() {
  _speechActive = false;
  if (_recognition) {
    try { _recognition.stop(); } catch(e) {}
  }
  updateMicButtons();
}

function updateMicButtons() {
  var btns = document.querySelectorAll('.mic-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('recording', _speechActive);
  }
}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  initSpeech();
});

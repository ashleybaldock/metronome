const metronome = new Metronome({ onBeatStart, onBeatEnd, onTempoChange, onGainChange, onDurationStart, onIntervalStart });

const playButton = document.getElementById('play-button');
playButton.addEventListener('click', () => {
  metronome.startStop();

  if (metronome.isRunning) {
    document.getElementById('durationProgress').classList.remove('hidden');
    document.getElementById('durationAnimate').beginElement();
    document.getElementById('playIcon').classList.add('hidden');
    document.getElementById('pauseIcon').classList.remove('hidden');
  } else {
    document.getElementById('durationProgress').classList.add('hidden');
    document.getElementById('playIcon').classList.remove('hidden');
    document.getElementById('pauseIcon').classList.add('hidden');
  }
});

function onBeatStart() {
  playButton.classList.add('beat');
}

function onBeatEnd() {
  playButton.classList.remove('beat');
}

function onTempoChange(newTempo) {
  document.getElementById('tempo').textContent = newTempo;
}

function onGainChange(newGain) {
  document.getElementById('gain').textContent = newGain.toFixed(2);
}

function onDurationStart(newDuration, running) {
  document.getElementById('duration').textContent = newDuration;
  document.getElementById('durationAnimate').setAttribute('dur', `${newDuration}s`);
  if (running) {
    document.getElementById('durationProgress').classList.remove('hidden');
    document.getElementById('durationAnimate').beginElement();
  }
}
function onIntervalStart(newInterval, running) {
  document.getElementById('interval').textContent = newInterval;
}

const tempoChangeButtons = document.getElementsByClassName('tempo-change');
for (let i = 0; i < tempoChangeButtons.length; i++) {
  tempoChangeButtons[i].addEventListener('click', function() {
    metronome.setTempo(metronome.getTempo() + parseInt(this.dataset.change, 10));
  });
}

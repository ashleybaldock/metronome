
const config = [
  {
    duration: 20.0,
    interval: 2.0,
    tempo: {
      start: 240,
      step: 0,
      baseStep: 0,
    },
    gain: {
      start: 0.02,
      step: 0,
      baseStep: 0,
    },
  },
];
const config3 = [
  {
    duration: 30.0,
    interval: 2.0,
    tempo: {
      base: 120,
      start: 120,
      step: -1,
      baseStep: -2,
    },
    gain: {
      base: 0.4,
      start: 0.4,
      step: 0.1,
      baseStep: 0.1,
    },
  },
  {
    duration: 5.0,
    interval: 1.0,
    tempo: {
      start: 400,
      step: 10,
      baseStep: 2,
    },
    gain: {
      start: 3.4,
      step: 1.1,
      baseStep: 0.1,
    },
  },
  {
    duration: 20.0,
    interval: 5.0,
    tempo: {
      start: 100,
      step: 0,
      baseStep: 2,
    },
    gain: {
      start: 0.4,
      step: 0.1,
      baseStep: 0.1,
    },
  },
  {
    duration: 10.0,
    interval: 1.0,
    tempo: {
      start: 400,
      step: 10,
      baseStep: 2,
    },
    gain: {
      start: 2.4,
      step: 0.8,
      baseStep: 0.1,
    },
  },
  {
    duration: 20.0,
    interval: 5.0,
    tempo: {
      start: 100,
      step: 0,
      baseStep: 2,
    },
    gain: {
      start: 0.4,
      step: 0.1,
      baseStep: 0.1,
    },
  },
];


const config1 = [
  {
    duration: 10.0,
    interval: 2.0,
    tempo: {
      start: 100,
      step: 0,
      baseStep: 2,
    },
    gain: {
      start: 2.4,
      step: 0.1,
      baseStep: 0.1,
    },
  },
  {
    duration: 5.0,
    interval: 1.0,
    tempo: {
      start: 300,
      step: 20,
      baseStep: 5,
    },
    gain: {
      start: 4.0,
      step: 2.0,
      baseStep: 0.5,
    },
  },
];

class Metronome {
  #gain;
  #tempo;

  #onBeatStart;
  #onBeatEnd;
  #onTempoChange;
  #onGainChange;
  #onIntervalStart;
  #onDurationStart;

  constructor({
    onBeatStart = () => {},
    onBeatEnd = () => {},
    onTempoChange = () => {},
    onGainChange = () => {},
    onIntervalStart = () => {},
    onDurationStart = () => {}
  }) {
    this.#onBeatStart = onBeatStart;
    this.#onBeatEnd = onBeatEnd;
    this.#onTempoChange = onTempoChange;
    this.#onGainChange = onGainChange;
    this.#onIntervalStart = onIntervalStart;
    this.#onDurationStart = onDurationStart;

    this.audioContext = null;
    this.notesInQueue = [];         // notes that have been put into the web audio and may or may not have been played yet {note, time}
    this.currentBeatInBar = 0;
    this.beatsPerBar = 1;
    this.lookahead = 25;          // How frequently to call scheduling function (in milliseconds)
    this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio (sec)
    this.nextNoteTime = 0.0;     // when the next note is due
    this.isRunning = false;
    this.intervalID = null;

    this.configIndex = -1;
    this.current = {};
    this.elapsed = {
      duration: 0,
      interval: 0,
    };
    this.nextConfig();

    // this.increaseTempoBy = 10;
    // this.increaseTempoInterval = 2.0;
    // this.timeLeftTilTempoIncrease = 2.0;

    // this.baseTempo = tempo;
    // this.increaseBaseTempoBy = 2;
    // this.increaseBaseTempoInterval = 30.0;
    // this.timeLeftTilBaseTempoIncreaseAndReset = 30.0;

    // this.increaseGainBy = 0.1;
    // this.increaseGainInterval = 2.0;
    // this.timeLeftTilGainIncrease = 2.0;

    // this.baseGain = baseGain;
    // this.increaseBaseGainBy = 0.1;
    // this.increaseBaseGainInterval = 30.0;
    // this.timeLeftTilBaseGainIncreaseAndReset = 30.0;
  }

  setTempo(newTempo) {
    this.#tempo = newTempo;
    this.#onTempoChange(newTempo);
  }
  stepTempo(step) {
    this.setTempo(this.getTempo() + step);
  }
  getTempo() {
    return this.#tempo;
  }

  setGain(newGain) {
    this.#gain = newGain;
    this.#onGainChange(newGain);
  };
  stepGain(step) {
    this.setGain(this.getGain() + step);
  }
  getGain() {
    return this.#gain;
  }

  resetInterval() {
    this.elapsed.interval = 0;
    this.#onIntervalStart(this.current.interval, this.isRunning);
  }

  resetDuration() {
    this.elapsed.duration = 0;
    this.#onDurationStart(this.current.duration, this.isRunning);
  }

  nextConfig() {
    ++this.configIndex >= config.length && (this.configIndex = 0);
    this.current = config[this.configIndex];
    this.resetDuration();
    this.resetInterval();
    this.setTempo(this.current.tempo.start);
    this.setGain(this.current.gain.start);
  }

  nextNote() {
    if (this.elapsed.duration >= this.current.duration) {
      this.current.tempo.start += this.current.tempo.baseStep;
      this.current.gain.start += this.current.gain.baseStep;
      this.nextConfig();
    }
    if (this.elapsed.interval >= this.current.interval) {
      this.elapsed.interval = 0;
      this.resetInterval();
      this.stepTempo(this.current.tempo.step);
      this.stepGain(this.current.gain.step);
    }

    const secondsPerBeat = 60.0 / this.getTempo(); // Use current tempo value to calculate beat length.
    this.nextNoteTime += secondsPerBeat;

    this.elapsed.duration += secondsPerBeat;
    this.elapsed.interval += secondsPerBeat;

    ++this.currentBeatInBar >= this.beatsPerBar && (this.currentBeatInBar = 0); // Advance the beat number, wrap to zero
  }

  scheduleNote(beatNumber, time) {
    // push the note on the queue, even if we're not playing.
    this.notesInQueue.push({ note: beatNumber, time: time });

    // create an oscillator
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.frequency.value = (beatNumber % this.beatsPerBar == 0) ? 1000 : 800;
    envelope.gain.value = this.getGain();
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    const silentOscillator = this.audioContext.createOscillator();
    silentOscillator.connect(this.audioContext.destination);
    silentOscillator.onended = this.#onBeatStart;
    silentOscillator.start(time);
    silentOscillator.stop(time);

    osc.onended = this.#onBeatEnd;
    osc.start(time);
    osc.stop(time + 0.03);
  }

  scheduler() {
    // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime ) {
      this.scheduleNote(this.currentBeatInBar, this.nextNoteTime);
      this.nextNote();
    }
  }

  start() {
    if (this.isRunning) return;

    if (this.audioContext == null) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    this.isRunning = true;

    this.currentBeatInBar = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05;

    this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isRunning = false;

    clearInterval(this.intervalID);
  }

  startStop() {
    this.isRunning ? this.stop() : this.start();
  }
}

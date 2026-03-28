import * as Tone from 'tone';

let activePart = null;
let activeSynth = null;
let completeTimeout = null;

export async function playMelody({ noteSequence, tempo, onNoteOn, onNoteOff, onComplete }) {
  try {
    await Tone.start();
  } catch (err) {
    console.error('Tone.start() failed:', err);
  }

  stopPlayback();

  const notes = noteSequence?.notes ?? [];
  if (notes.length === 0) return;

  // Scale note times so that tempo slider actually changes playback speed
  // Notes from MelodyRNN are in seconds at 120 BPM baseline
  const timeScale = 120 / (tempo || 120);

  activeSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.8 },
  }).toDestination();

  const events = notes.map(note => ({
    time: note.startTime * timeScale,
    pitch: note.pitch,
    duration: (note.endTime - note.startTime) * timeScale,
  }));

  const lastEnd = Math.max(...notes.map(n => n.endTime)) * timeScale;

  activePart = new Tone.Part((time, event) => {
    const freq = Tone.Frequency(event.pitch, 'midi').toFrequency();
    activeSynth.triggerAttackRelease(freq, event.duration, time);

    const delayMs = Math.max(0, (time - Tone.now()) * 1000);
    setTimeout(() => {
      if (onNoteOn) onNoteOn(event.pitch);
      setTimeout(() => {
        if (onNoteOff) onNoteOff(event.pitch);
      }, event.duration * 1000);
    }, delayMs);
  }, events);

  activePart.start(0);
  Tone.Transport.start();

  completeTimeout = setTimeout(() => {
    if (onComplete) onComplete();
  }, (lastEnd + 0.3) * 1000);
}

export function stopPlayback() {
  Tone.Transport.stop();
  Tone.Transport.cancel();

  clearTimeout(completeTimeout);
  completeTimeout = null;

  if (activePart) {
    activePart.dispose();
    activePart = null;
  }
  if (activeSynth) {
    activeSynth.dispose();
    activeSynth = null;
  }
}

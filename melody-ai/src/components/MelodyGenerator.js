import { pickNextDuration, pickNextMelodyStep, generateChordSequence } from './MarkovEngine';

// ─── Music Theory Foundation ──────────────────────────────────────────────────

const MOOD_THEORY = {
  happy: {
    scale:      [0, 2, 4, 5, 7, 9, 11],
    root:       60,
    chords:     [[0,4,7],[5,9,12],[9,12,16],[7,11,14]],
    rhythm:     [0.25, 0.25, 0.5],
    registers:  [60, 72],
    feel:       'bouncy',
    defaultBPM: 108,
    description: 'Major scale — bright and energetic',
  },
  sad: {
    scale:      [0, 2, 3, 5, 7, 8, 10],
    root:       57,
    chords:     [[0,3,7],[5,8,12],[3,7,10],[8,12,15]],
    rhythm:     [1.0, 1.5, 2.0],
    registers:  [52, 64],
    feel:       'slow',
    defaultBPM: 68,
    description: 'Natural minor scale — melancholic and reflective',
  },
  jazz: {
    scale:      [0, 2, 3, 5, 7, 9, 10, 11],
    root:       58,
    chords:     [[0,4,7,10],[5,9,12,15],[2,5,9,12],[7,11,14,17]],
    rhythm:     [0.25, 0.375, 0.75],
    registers:  [60, 72],
    feel:       'swing',
    defaultBPM: 112,
    description: 'Bebop scale — complex and syncopated',
  },
  classical: {
    scale:      [0, 2, 4, 5, 7, 9, 11],
    root:       60,
    chords:     [[0,4,7],[4,7,11],[5,9,12],[7,11,14]],
    rhythm:     [0.5, 0.5, 1.0],
    registers:  [60, 76],
    feel:       'flowing',
    defaultBPM: 96,
    description: 'Major scale — structured and elegant',
  },
  lofi: {
    scale:      [0, 2, 3, 5, 7, 10],
    root:       58,
    chords:     [[0,3,7],[3,7,10],[5,8,12],[7,10,14]],
    rhythm:     [0.5, 0.75, 1.0],
    registers:  [55, 67],
    feel:       'lazy',
    defaultBPM: 82,
    description: 'Minor pentatonic — chill and hazy',
  },
  epic: {
    scale:      [0, 2, 3, 5, 7, 8, 11],
    root:       60,
    chords:     [[0,3,7],[7,11,14],[5,8,12],[8,12,15]],
    rhythm:     [0.25, 0.5, 1.0],
    registers:  [55, 67],
    feel:       'driving',
    defaultBPM: 145,
    description: 'Harmonic minor — cinematic and powerful',
  },
  romantic: {
    scale:      [0, 2, 4, 5, 7, 9, 11],
    root:       62,
    chords:     [[0,4,7,11],[4,7,11,14],[5,9,12,16],[2,5,9,12]],
    rhythm:     [0.75, 1.0, 1.5],
    registers:  [60, 72],
    feel:       'flowing',
    defaultBPM: 84,
    description: 'Major scale — warm and expressive',
  },
  mysterious: {
    scale:      [0, 1, 4, 5, 7, 8, 11],
    root:       60,
    chords:     [[0,3,7],[8,12,15],[5,8,12],[7,10,14]],
    rhythm:     [0.5, 1.0, 1.5],
    registers:  [52, 64],
    feel:       'sparse',
    defaultBPM: 78,
    description: 'Byzantine scale — dark and exotic',
  },
};

export const DEFAULT_TEMPOS = Object.fromEntries(
  Object.entries(MOOD_THEORY).map(([k, v]) => [k, v.defaultBPM])
);

// ─── Drum MIDI note map (General MIDI standard) ───────────────────────────────

const DRUM_NOTES = {
  kick:    36,
  snare:   38,
  hihat:   42,
  openhat: 46,
  clap:    39,
  rimshot: 37,
  tom_hi:  50,
  tom_lo:  45,
  crash:   49,
  ride:    51,
};

const BEAT = 0.5; // quarter note at 120 BPM reference
const BAR  = BEAT * 4;

// ─── helpers ─────────────────────────────────────────────────────────────────

function drumHit(notes, pitch, time, velocity, jitter = 0.02) {
  const t   = Math.max(0, time + (Math.random() * jitter - jitter / 2));
  const vel = Math.max(1, Math.min(127, velocity + Math.floor(Math.random() * 17) - 8));
  notes.push({ pitch, startTime: t, endTime: t + 0.05, velocity: vel });
}

// ─── buildChordVoicing ───────────────────────────────────────────────────────

function buildChordVoicing(rootMidi, chordType) {
  const intervals = {
    major:  [0, 4, 7],
    minor:  [0, 3, 7],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    dom7:   [0, 4, 7, 10],
    dim:    [0, 3, 6],
  };
  return (intervals[chordType] ?? intervals.major).map(i => rootMidi + i);
}

const CHORD_TYPE_MAP = {
  happy:      ['major',  'major',  'minor',  'major' ],
  sad:        ['minor',  'minor7', 'major',  'minor' ],
  jazz:       ['minor7', 'dom7',   'major7', 'dom7'  ],
  classical:  ['major',  'minor',  'major',  'major' ],
  lofi:       ['minor7', 'major',  'minor',  'minor7'],
  epic:       ['minor',  'major',  'minor',  'major' ],
  romantic:   ['major7', 'minor',  'major',  'minor7'],
  mysterious: ['minor',  'major',  'dim',    'minor' ],
};

// ─── buildScaleNotes ─────────────────────────────────────────────────────────

function buildScaleNotes(mood, octaveRange) {
  const theory = MOOD_THEORY[mood];
  if (!theory) return [60];
  const root  = theory.root - 12;
  const notes = [];
  for (let oct = 0; oct < octaveRange; oct++) {
    for (const interval of theory.scale) {
      notes.push(root + oct * 12 + interval);
    }
  }
  return notes.sort((a, b) => a - b);
}

// ─── generateLeadMelody ──────────────────────────────────────────────────────
// Uses Markov interval chain — each step is drawn from MELODY_STEP_TRANSITIONS.
// Generates until minRawTime is filled so the actual playback hits ≥15s.

function generateLeadMelody(mood, minRawTime) {
  const theory = MOOD_THEORY[mood];
  const scale  = buildScaleNotes(mood, 3).filter(
    n => n >= theory.registers[0] && n <= theory.registers[1]
  );
  if (!scale.length) return { notes: [], totalTime: minRawTime };

  const notes    = [];
  let time       = 0;
  let prevPrev   = 0.5;
  let prev       = 0.25;
  let noteCount  = 0;

  // Start in the lower third of the register
  const startPool = scale.filter(n => n >= theory.registers[0] && n <= theory.registers[0] + 7);
  const startNote = startPool.length > 0
    ? startPool[Math.floor(Math.random() * startPool.length)]
    : scale[Math.floor(scale.length * 0.3)];
  let scaleIdx = scale.indexOf(startNote);
  if (scaleIdx < 0) scaleIdx = Math.floor(scale.length * 0.3);

  let lastStep = 1;

  while (time < minRawTime || noteCount < 8) {
    const duration = pickNextDuration(prevPrev, prev, mood);
    prevPrev = prev;
    prev     = duration || 0.5;

    if (duration === 0) {
      time += 0.5;
      continue;
    }

    // Markov interval step
    let step   = pickNextMelodyStep(lastStep, mood);
    let newIdx = scaleIdx + step;

    // Boundary correction: reverse direction rather than hard-clamp
    if (newIdx < 0 || newIdx >= scale.length) {
      step   = -step;
      newIdx = scaleIdx + step;
    }
    newIdx   = Math.max(0, Math.min(scale.length - 1, newIdx));
    scaleIdx = newIdx;
    lastStep = step || 1;

    // Natural arc velocity: quiet at start and end, louder in the middle
    const progress = Math.min(time / minRawTime, 1);
    const arc      = Math.sin(Math.PI * progress);
    const velocity = Math.round(55 + arc * 45);

    notes.push({
      pitch:     scale[scaleIdx],
      startTime: time,
      endTime:   time + duration,
      velocity:  Math.max(50, Math.min(110, velocity)),
    });
    time += duration;
    noteCount++;
  }

  // Resolve to root
  const lastTime = notes[notes.length - 1]?.endTime ?? time;
  notes.push({ pitch: theory.root, startTime: lastTime, endTime: lastTime + 1.0, velocity: 65 });

  return { notes, totalTime: lastTime + 1.0 };
}

// ─── generateCounterMelody ───────────────────────────────────────────────────
// Markov interval chain, lower register, slight time offset for counterpoint.

function generateCounterMelody(mood, totalTime) {
  const theory = MOOD_THEORY[mood];
  const scale  = buildScaleNotes(mood, 2).filter(
    n => n >= theory.root - 7 && n <= theory.root + 8
  );
  if (!scale.length) return { notes: [], totalTime };

  const notes  = [];
  let time     = 0.75; // offset for counterpoint feel
  let prevPrev = 0.5;
  let prev     = 0.5;

  let scaleIdx = Math.floor(scale.length * 0.4);
  let lastStep = -1; // start descending — contrary motion to ascending lead

  while (time < totalTime * 0.85) {
    const duration = pickNextDuration(prevPrev, prev, mood);
    prevPrev = prev;
    prev     = duration || 0.5;

    if (duration === 0) { time += 0.5; continue; }

    let step   = pickNextMelodyStep(lastStep, mood);
    let newIdx = scaleIdx + step;
    if (newIdx < 0 || newIdx >= scale.length) {
      step   = -step;
      newIdx = scaleIdx + step;
    }
    newIdx   = Math.max(0, Math.min(scale.length - 1, newIdx));
    scaleIdx = newIdx;
    lastStep = step || -1;

    notes.push({
      pitch:     scale[scaleIdx],
      startTime: time,
      endTime:   time + duration,
      velocity:  48 + Math.floor(Math.random() * 15),
    });
    time += duration;
  }

  return { notes, totalTime };
}

// ─── generateBassLine ────────────────────────────────────────────────────────
// Follows the shared Markov chord sequence — root on the downbeat every 2s,
// Markov rhythm decides whether a second note fills beat 2.

function generateBassLine(mood, chordDegrees) {
  const theory   = MOOD_THEORY[mood];
  const bassRoot = theory.root - 24;
  const notes    = [];

  for (let i = 0; i < chordDegrees.length; i++) {
    const degree       = chordDegrees[i];
    const interval     = theory.scale[degree % theory.scale.length];
    const rootNote     = Math.max(28, Math.min(52, bassRoot + interval));
    const slotStart    = i * 2.0;

    // Always play chord root on the downbeat
    const dur1 = pickNextDuration(0.5, 0.5, mood);
    notes.push({
      pitch:     rootNote,
      startTime: slotStart,
      endTime:   slotStart + Math.min(dur1, 1.8),
      velocity:  85 + Math.floor(Math.random() * 15),
    });

    // Optional second bass note on beat 2 (Markov picks duration)
    const dur2 = pickNextDuration(dur1, dur1, mood);
    if (dur2 <= 1.0) {
      // Fifth above root or second scale step — both harmonically safe
      const fifth  = rootNote + 7;
      const step2  = rootNote + (theory.scale[1] ?? 2);
      const pitch2 = Math.max(28, Math.min(52, Math.random() < 0.55 ? fifth : step2));
      notes.push({
        pitch:     pitch2,
        startTime: slotStart + 1.0,
        endTime:   slotStart + 1.0 + Math.min(dur2, 0.9),
        velocity:  72 + Math.floor(Math.random() * 12),
      });
    }
  }

  return { notes, totalTime: chordDegrees.length * 2.0 };
}

// ─── buildChordsFromDegrees ───────────────────────────────────────────────────
// Builds chord voicings from the shared Markov degree sequence.

function buildChordsFromDegrees(mood, degreeSequence, totalTime) {
  const theory     = MOOD_THEORY[mood];
  const chordTypes = CHORD_TYPE_MAP[mood] ?? CHORD_TYPE_MAP.happy;
  const notesArr   = [];

  for (let i = 0; i < degreeSequence.length; i++) {
    const degree        = degreeSequence[i];
    const scaleInterval = theory.scale[degree % theory.scale.length];
    const rootMidi      = theory.root + scaleInterval;
    const chordType     = chordTypes[i % 4];
    const voicing       = buildChordVoicing(rootMidi, chordType);
    const startTime     = i * 2.0;
    const endTime       = startTime + 1.85;

    for (const pitch of voicing) {
      notesArr.push({ pitch, startTime, endTime, velocity: 50 });
    }
  }

  return { notes: notesArr, totalTime };
}

// ─── generateDrumPattern ─────────────────────────────────────────────────────

export function generateDrumPattern(drumStyle, totalTime) {
  const notes = [];
  const style = drumStyle ?? 'four_on_floor';

  if (style === 'four_on_floor') {
    const STEP = BEAT * 2;
    let t = 0;
    while (t < totalTime) {
      drumHit(notes, DRUM_NOTES.kick,  t,               100);
      drumHit(notes, DRUM_NOTES.hihat, t,                70);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 0.5,  60);
      drumHit(notes, DRUM_NOTES.snare, t + BEAT,         90);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT,         70);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 1.5,  55);
      if (Math.random() < 0.2) {
        drumHit(notes, DRUM_NOTES.kick, t + BEAT * 1.5, 80);
      }
      t += STEP;
    }

  } else if (style === 'driving') {
    const STEP = BEAT * 2;
    let t      = 0;
    let stepNum = 0;
    while (t < totalTime) {
      const isBarAccent = stepNum % 8 === 0;
      const isTomFill   = stepNum % 8 === 7;
      drumHit(notes, DRUM_NOTES.kick,  t,               110);
      drumHit(notes, DRUM_NOTES.kick,  t + BEAT * 0.25,  80);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 0.5,   75);
      drumHit(notes, DRUM_NOTES.snare, t + BEAT,         100);
      if (isBarAccent) {
        drumHit(notes, DRUM_NOTES.crash, t + BEAT,        90);
      }
      drumHit(notes, DRUM_NOTES.kick,  t + BEAT * 1.5,   95);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 1.75,  65);
      if (isTomFill) {
        drumHit(notes, DRUM_NOTES.tom_hi, t + BEAT * 0.75, 80);
        drumHit(notes, DRUM_NOTES.tom_lo, t + BEAT,         75);
      }
      t += STEP;
      stepNum++;
    }

  } else if (style === 'jazz_brush') {
    let t = 0;
    while (t < totalTime) {
      for (let i = 0; i < 8; i++) {
        const rideVel = 55 + Math.floor(Math.random() * 16);
        drumHit(notes, DRUM_NOTES.ride, t + i * BEAT * 0.5, rideVel);
      }
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 1.0, 50);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 3.0, 50);
      for (const i of [1, 3, 5, 7]) {
        if (Math.random() < 0.3) {
          const ghostVel = 35 + Math.floor(Math.random() * 16);
          drumHit(notes, DRUM_NOTES.snare, t + i * BEAT * 0.5, ghostVel);
        }
      }
      const kickCount = 1 + Math.floor(Math.random() * 2);
      for (let k = 0; k < kickCount; k++) {
        const kickPos = Math.floor(Math.random() * 8) * BEAT * 0.5;
        drumHit(notes, DRUM_NOTES.kick, t + kickPos, 65 + Math.floor(Math.random() * 16));
      }
      t += BAR;
    }

  } else if (style === 'lofi_beat') {
    const STEP = BEAT * 2;
    let t = 0;
    while (t < totalTime) {
      drumHit(notes, DRUM_NOTES.kick,  t,                 85, 0.04);
      drumHit(notes, DRUM_NOTES.snare, t + BEAT + 0.05,   75, 0.04);
      for (let i = 0; i < 4; i++) {
        const hatVel = 45 + Math.floor(Math.random() * 16);
        drumHit(notes, DRUM_NOTES.hihat, t + i * BEAT * 0.5, hatVel, 0.04);
      }
      if (Math.random() < 0.35) {
        drumHit(notes, DRUM_NOTES.kick, t + BEAT * 1.5, 70, 0.04);
      }
      t += STEP;
    }

  } else if (style === 'soft_brush') {
    const STEP = BEAT * 2;
    let t = 0;
    while (t < totalTime) {
      drumHit(notes, DRUM_NOTES.kick,    t,               55);
      drumHit(notes, DRUM_NOTES.rimshot, t + BEAT,        45);
      drumHit(notes, DRUM_NOTES.hihat,   t + BEAT * 0.5,  35);
      drumHit(notes, DRUM_NOTES.hihat,   t + BEAT * 1.5,  35);
      t += STEP;
    }

  } else if (style === 'sparse_ambient') {
    const STEP = BAR * 2;
    let t      = 0;
    let patNum = 0;
    while (t < totalTime) {
      const tomPos = Math.random() * Math.max(0.1, STEP - 0.1);
      drumHit(notes, DRUM_NOTES.tom_lo, t + tomPos, 60);
      if (patNum % 2 === 0) {
        drumHit(notes, DRUM_NOTES.crash, t + STEP * 0.5, 40);
      }
      const rimPos = Math.random() * Math.max(0.1, STEP - 0.1);
      drumHit(notes, DRUM_NOTES.rimshot, t + rimPos, 30 + Math.floor(Math.random() * 16));
      t += STEP;
      patNum++;
    }

  } else {
    // Fallback: four_on_floor
    const STEP = BEAT * 2;
    let t = 0;
    while (t < totalTime) {
      drumHit(notes, DRUM_NOTES.kick,  t,               100);
      drumHit(notes, DRUM_NOTES.hihat, t,                70);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 0.5,  60);
      drumHit(notes, DRUM_NOTES.snare, t + BEAT,         90);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT,         70);
      drumHit(notes, DRUM_NOTES.hihat, t + BEAT * 1.5,  55);
      t += STEP;
    }
  }

  return { notes, totalTime };
}

// ─── generateMelody ──────────────────────────────────────────────────────────
// Chord sequence is generated once and shared by chords + bass so they stay
// in sync. Lead and counter both use the Markov interval chain.

export async function generateMelody({ mood, drumStyle, layers, tempo }) {
  const m   = mood  ?? 'happy';
  const bpm = tempo ?? 120;

  // Compute how many raw-time seconds are needed to reach ≥15 actual seconds.
  // Raw times are expressed at 120 BPM; Playback.js scales by 120/bpm.
  const minRawTime = Math.max(15, 15 * bpm / 120);

  const lead = generateLeadMelody(m, minRawTime);
  const totalTime = lead.totalTime;

  // Single Markov chord sequence — drives both chords and bass
  const slotCount    = Math.ceil(totalTime / 2);
  const chordDegrees = generateChordSequence(m, slotCount);

  const counter = generateCounterMelody(m, totalTime);
  const bass    = generateBassLine(m, chordDegrees);
  const chords  = buildChordsFromDegrees(m, chordDegrees, totalTime);
  const drums   = generateDrumPattern(drumStyle ?? 'four_on_floor', totalTime);

  console.log('[MelodyAI] Generated', {
    mood:         m,
    bpm,
    drumStyle:    drumStyle ?? 'four_on_floor',
    layers:       layers    ?? 'standard',
    scale:        MOOD_THEORY[m].description,
    leadNotes:    lead.notes?.length ?? 0,
    counterNotes: counter.notes.length,
    bassNotes:    bass.notes.length,
    chordNotes:   chords.notes.length,
    drumNotes:    drums.notes.length,
    rawTime:      totalTime.toFixed(2) + 's',
    actualTime:   (totalTime * 120 / bpm).toFixed(2) + 's',
  });

  if (layers === 'minimal') {
    return { lead, counter: null, bass: null, chords, drums };
  }

  return { lead, counter, bass, chords, drums };
}

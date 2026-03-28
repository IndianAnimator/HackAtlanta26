import { composeWithClaude } from './ClaudeComposer';

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
  },
  sad: {
    scale:      [0, 2, 3, 5, 7, 8, 10],
    root:       57,
    chords:     [[0,3,7],[5,8,12],[3,7,10],[8,12,15]],
    rhythm:     [1.0, 1.5, 2.0],
    registers:  [52, 64],
    feel:       'slow',
    defaultBPM: 68,
  },
  jazz: {
    scale:      [0, 2, 3, 5, 7, 9, 10, 11],
    root:       58,
    chords:     [[0,4,7,10],[5,9,12,15],[2,5,9,12],[7,11,14,17]],
    rhythm:     [0.25, 0.375, 0.75],
    registers:  [60, 72],
    feel:       'swing',
    defaultBPM: 112,
  },
  classical: {
    scale:      [0, 2, 4, 5, 7, 9, 11],
    root:       60,
    chords:     [[0,4,7],[4,7,11],[5,9,12],[7,11,14]],
    rhythm:     [0.5, 0.5, 1.0],
    registers:  [60, 76],
    feel:       'flowing',
    defaultBPM: 96,
  },
  lofi: {
    scale:      [0, 2, 3, 5, 7, 10],
    root:       58,
    chords:     [[0,3,7],[3,7,10],[5,8,12],[7,10,14]],
    rhythm:     [0.5, 0.75, 1.0],
    registers:  [55, 67],
    feel:       'lazy',
    defaultBPM: 82,
  },
  epic: {
    scale:      [0, 2, 3, 5, 7, 8, 11],
    root:       60,
    chords:     [[0,3,7],[7,11,14],[5,8,12],[8,12,15]],
    rhythm:     [0.25, 0.5, 1.0],
    registers:  [55, 67],
    feel:       'driving',
    defaultBPM: 145,
  },
  romantic: {
    scale:      [0, 2, 4, 5, 7, 9, 11],
    root:       62,
    chords:     [[0,4,7,11],[4,7,11,14],[5,9,12,16],[2,5,9,12]],
    rhythm:     [0.75, 1.0, 1.5],
    registers:  [60, 72],
    feel:       'flowing',
    defaultBPM: 84,
  },
  mysterious: {
    scale:      [0, 1, 4, 5, 7, 8, 11],
    root:       60,
    chords:     [[0,3,7],[8,12,15],[5,8,12],[7,10,14]],
    rhythm:     [0.5, 1.0, 1.5],
    registers:  [52, 64],
    feel:       'sparse',
    defaultBPM: 78,
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

// ─── Simple random helpers (used in algorithmic fallback only) ────────────────

function pickRandomDuration(mood) {
  const pool = MOOD_THEORY[mood]?.rhythm ?? [0.25, 0.5, 1.0];
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickRandomStep() {
  const steps = [-2, -1, 1, 2];
  return steps[Math.floor(Math.random() * steps.length)];
}

function pickRandomChordDegrees(mood, slotCount) {
  const scaleLen = MOOD_THEORY[mood]?.scale?.length ?? 7;
  const seq = [];
  for (let i = 0; i < slotCount; i++) {
    seq.push(Math.floor(Math.random() * scaleLen));
  }
  return seq;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function hit(notes, pitch, time, velocity) {
  notes.push({ pitch, startTime: time, endTime: time + 0.05, velocity });
}

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

function generateLeadMelody(mood) {
  const theory     = MOOD_THEORY[mood];
  const minRawTime = 15;
  const scale      = buildScaleNotes(mood, 3).filter(
    n => n >= theory.registers[0] && n <= theory.registers[1]
  );
  if (!scale.length) return { notes: [], totalTime: minRawTime };

  const notes   = [];
  let time      = 0;
  let noteCount = 0;

  const startPool = scale.filter(n => n >= theory.registers[0] && n <= theory.registers[0] + 7);
  const startNote = startPool.length > 0
    ? startPool[Math.floor(Math.random() * startPool.length)]
    : scale[Math.floor(scale.length * 0.3)];
  let scaleIdx = scale.indexOf(startNote);
  if (scaleIdx < 0) scaleIdx = Math.floor(scale.length * 0.3);

  while (time < minRawTime || noteCount < 8) {
    const duration = pickRandomDuration(mood);

    if (duration === 0) { time += 0.5; continue; }

    let step   = pickRandomStep();
    let newIdx = scaleIdx + step;
    if (newIdx < 0 || newIdx >= scale.length) {
      step   = -step;
      newIdx = scaleIdx + step;
    }
    newIdx   = Math.max(0, Math.min(scale.length - 1, newIdx));
    scaleIdx = newIdx;

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

  const lastTime = notes[notes.length - 1]?.endTime ?? time;
  notes.push({ pitch: theory.root, startTime: lastTime, endTime: lastTime + 1.0, velocity: 65 });

  return { notes, totalTime: lastTime + 1.0 };
}

// ─── generateCounterMelody ───────────────────────────────────────────────────

function generateCounterMelody(mood, totalTime) {
  const theory = MOOD_THEORY[mood];
  const scale  = buildScaleNotes(mood, 2).filter(
    n => n >= theory.root - 7 && n <= theory.root + 8
  );
  if (!scale.length) return { notes: [], totalTime };

  const notes  = [];
  let time     = 0.75;
  let scaleIdx = Math.floor(scale.length * 0.4);

  while (time < totalTime * 0.85) {
    const duration = pickRandomDuration(mood);
    if (duration === 0) { time += 0.5; continue; }

    let step   = pickRandomStep();
    let newIdx = scaleIdx + step;
    if (newIdx < 0 || newIdx >= scale.length) {
      step   = -step;
      newIdx = scaleIdx + step;
    }
    newIdx   = Math.max(0, Math.min(scale.length - 1, newIdx));
    scaleIdx = newIdx;

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

function generateBassLine(mood, totalTime) {
  const theory      = MOOD_THEORY[mood];
  const bassRoot    = theory.root - 24;
  const slotCount   = Math.ceil(totalTime / 2);
  const degrees     = pickRandomChordDegrees(mood, slotCount);
  const notes       = [];

  for (let i = 0; i < degrees.length; i++) {
    const degree    = degrees[i];
    const interval  = theory.scale[degree % theory.scale.length];
    const rootNote  = Math.max(28, Math.min(52, bassRoot + interval));
    const slotStart = i * 2.0;

    const dur1 = pickRandomDuration(mood);
    notes.push({
      pitch:     rootNote,
      startTime: slotStart,
      endTime:   slotStart + Math.min(dur1, 1.8),
      velocity:  85 + Math.floor(Math.random() * 15),
    });

    const dur2 = pickRandomDuration(mood);
    if (dur2 <= 1.0) {
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

  return { notes, totalTime };
}

// ─── generateChordProgression ─────────────────────────────────────────────────

function generateChordProgression(mood, totalTime) {
  const theory     = MOOD_THEORY[mood];
  const chordTypes = CHORD_TYPE_MAP[mood] ?? CHORD_TYPE_MAP.happy;
  const slotCount  = Math.ceil(totalTime / 2);
  const degrees    = pickRandomChordDegrees(mood, slotCount);
  const notesArr   = [];

  for (let i = 0; i < degrees.length; i++) {
    const degree        = degrees[i];
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
// Exact pattern — no jitter, no randomness, consistent velocity:
//   Kick  : every beat (1, 2, 3, 4)
//   Snare : beats 2 and 4 only
//   Hi-hat: every 8th note (2-step)
//   No crash, no toms, no variation

export function generateDrumPattern(_drumStyle, totalTime) {
  const notes  = [];
  const EIGHTH = 0.25; // eighth note at 120 BPM reference
  const BAR    = 2.0;  // 4 beats × 0.5

  const K = 100; // kick velocity
  const S = 90;  // snare velocity
  const H = 70;  // hihat velocity

  let t = 0;
  while (t < totalTime) {
    // Beat 1
    hit(notes, DRUM_NOTES.kick,  t + EIGHTH * 0, K);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 0, H);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 1, H);
    // Beat 2
    hit(notes, DRUM_NOTES.kick,  t + EIGHTH * 2, K);
    hit(notes, DRUM_NOTES.snare, t + EIGHTH * 2, S);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 2, H);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 3, H);
    // Beat 3
    hit(notes, DRUM_NOTES.kick,  t + EIGHTH * 4, K);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 4, H);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 5, H);
    // Beat 4
    hit(notes, DRUM_NOTES.kick,  t + EIGHTH * 6, K);
    hit(notes, DRUM_NOTES.snare, t + EIGHTH * 6, S);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 6, H);
    hit(notes, DRUM_NOTES.hihat, t + EIGHTH * 7, H);

    t += BAR;
  }

  return { notes, totalTime };
}

// ─── generateMelody ──────────────────────────────────────────────────────────

export async function generateMelody({ mood, drumStyle, theme, tempo }) {

  // 1. Try Claude first — always
  console.log('[MelodyAI] Calling Claude API...')
  const claudeResult = await composeWithClaude(theme ?? mood, mood, tempo ?? 120)

  let lead, counter, bass, chords

  if (claudeResult) {
    // Claude succeeded — normalize absolute-second times to 120 BPM reference
    // so Playback.js timeScale doesn't double-scale them
    const bpmFactor = (tempo ?? 120) / 120
    const normalize = (layer) => ({
      notes: layer.notes.map(n => ({
        ...n,
        startTime: n.startTime * bpmFactor,
        endTime:   n.endTime   * bpmFactor,
      })),
      totalTime: layer.totalTime * bpmFactor,
    })
    lead    = normalize(claudeResult.lead)
    counter = normalize(claudeResult.counter)
    bass    = normalize(claudeResult.bass)
    chords  = normalize(claudeResult.chords)
    console.log('[MelodyAI] Using Claude composition')
  } else {
    // Claude failed — fall back to algorithmic only as last resort
    console.warn('[MelodyAI] Claude failed — using algorithmic fallback')
    lead    = generateLeadMelody(mood)
    counter = generateCounterMelody(mood, lead.totalTime)
    bass    = generateBassLine(mood, lead.totalTime)
    chords  = generateChordProgression(mood, lead.totalTime)
  }

  // Drums always algorithmic regardless
  const drums = generateDrumPattern(drumStyle ?? 'four_on_floor', lead.totalTime)

  return {
    lead, counter, bass, chords, drums,
    source: claudeResult ? 'claude' : 'algorithmic'
  }
}

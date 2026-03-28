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

const BEAT = 0.5; // quarter note at 120 BPM reference (transport seconds)
const BAR  = BEAT * 4; // 2.0s — one 4/4 bar

// ─── helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function drumHit(notes, pitch, time, velocity, jitter = 0.02) {
  const t   = Math.max(0, time + (Math.random() * jitter - jitter / 2));
  const vel = Math.max(1, Math.min(127, velocity + Math.floor(Math.random() * 17) - 8));
  notes.push({ pitch, startTime: t, endTime: t + 0.05, velocity: vel });
}

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

// ─── getMoodTemperature ──────────────────────────────────────────────────────

function getMoodTemperature(mood) {
  const base = {
    happy: 0.9, sad: 0.8, jazz: 1.2, classical: 0.8,
    lofi: 1.0, epic: 1.1, romantic: 0.85, mysterious: 1.15,
  };
  return Math.min(1.5, Math.max(0.5, (base[mood] ?? 1.0) + (Math.random() * 0.3 - 0.15)));
}

// ─── buildRandomSeedFromMood ─────────────────────────────────────────────────

function buildRandomSeedFromMood(mood) {
  const scaleNotes = buildScaleNotes(mood, 1);
  const count      = 3 + Math.floor(Math.random() * 2);
  const picked     = Array.from({ length: count }, () => pick(scaleNotes));
  return {
    notes: picked.map((pitch, i) => ({
      pitch,
      startTime: i * 0.5,
      endTime:   i * 0.5 + 0.5,
      velocity:  60 + Math.floor(Math.random() * 40),
    })),
    totalTime: picked.length * 0.5,
    tempos: [{ time: 0, qpm: 120 }],
    quantizationInfo: { stepsPerQuarter: 4 },
  };
}

// ─── generateLeadMelody ──────────────────────────────────────────────────────

function generateLeadMelody(mood) {
  const theory = MOOD_THEORY[mood];
  const scale  = buildScaleNotes(mood, 2).filter(
    n => n >= theory.registers[0] && n <= theory.registers[1]
  );
  const notes      = [];
  let time         = 0;
  const totalNotes = 12 + Math.floor(Math.random() * 8);

  for (let i = 0; i < totalNotes; i++) {
    const progress = i / totalNotes;
    let targetRange;

    if (progress < 0.25) {
      // Opening: start in lower-mid range
      targetRange = scale.filter(
        n => n >= theory.registers[0] && n <= theory.registers[0] + 7
      );
    } else if (progress < 0.65) {
      // Build: move upward
      targetRange = scale.filter(
        n => n >= theory.registers[0] + 4 && n <= theory.registers[1] - 2
      );
    } else if (progress < 0.8) {
      // Climax: highest notes
      targetRange = scale.filter(
        n => n >= theory.registers[0] + 7 && n <= theory.registers[1]
      );
    } else {
      // Resolution: come back down to root area
      targetRange = scale.filter(
        n => n >= theory.registers[0] && n <= theory.registers[0] + 5
      );
    }

    if (!targetRange.length) targetRange = scale;

    // Stepwise motion 70% of the time (more musical)
    let pitch;
    const last = notes[notes.length - 1]?.pitch;
    if (last && Math.random() < 0.7) {
      const lastIdx = scale.indexOf(last);
      const step    = Math.random() < 0.5 ? 1 : -1;
      const next    = scale[Math.min(scale.length - 1, Math.max(0, lastIdx + step))];
      pitch = targetRange.includes(next)
        ? next
        : targetRange[Math.floor(Math.random() * targetRange.length)];
    } else {
      pitch = targetRange[Math.floor(Math.random() * targetRange.length)];
    }

    // No more than 2 repeated notes in a row
    if (
      notes.length >= 2 &&
      notes[notes.length - 1].pitch === pitch &&
      notes[notes.length - 2].pitch === pitch
    ) {
      const others = targetRange.filter(n => n !== pitch);
      if (others.length) pitch = others[Math.floor(Math.random() * others.length)];
    }

    // Rest chance based on feel
    if (theory.feel === 'sparse' && Math.random() < 0.3) {
      time += theory.rhythm[Math.floor(Math.random() * theory.rhythm.length)];
      continue;
    }

    const duration = theory.rhythm[Math.floor(Math.random() * theory.rhythm.length)];
    const velocity = progress < 0.65
      ? 65 + Math.floor(progress * 40)
      : 95 - Math.floor((progress - 0.65) * 60);

    notes.push({
      pitch,
      startTime: time,
      endTime:   time + duration,
      velocity:  Math.max(50, Math.min(110, velocity)),
    });
    time += duration;
  }

  // Always end on root for resolution
  const lastTime = notes[notes.length - 1]?.endTime ?? time;
  notes.push({ pitch: theory.root, startTime: lastTime, endTime: lastTime + 1.0, velocity: 70 });

  return { notes, totalTime: lastTime + 1.0 };
}

// ─── generateCounterMelody ───────────────────────────────────────────────────

function generateCounterMelody(mood) {
  const theory     = MOOD_THEORY[mood];
  const scaleNotes = buildScaleNotes(mood, 2);
  const midRange   = scaleNotes.filter(
    n => n >= theory.root - 5 && n <= theory.root + 7
  );
  const pool      = midRange.length > 0 ? midRange : scaleNotes;
  const noteCount = 7 + Math.floor(Math.random() * 5);
  const durations = [0.75, 1.0, 1.5, 2.0];
  const notes     = [];
  let time        = 0.5;

  for (let i = 0; i < noteCount; i++) {
    const pitch    = pick(pool);
    const duration = pick(durations);
    const velocity = 50 + Math.floor(Math.random() * 20);
    notes.push({ pitch, startTime: time, endTime: time + duration, velocity });
    time += duration;
  }

  return { notes, totalTime: time };
}

// ─── generateBassLine ────────────────────────────────────────────────────────

function generateBassLine(mood) {
  const theory     = MOOD_THEORY[mood];
  const bassRoot   = theory.root - 24;
  const scaleNotes = buildScaleNotes(mood, 1)
    .map(n => n - 24)
    .filter(n => n >= 28 && n <= 52);
  const pool      = scaleNotes.length > 0 ? scaleNotes : [bassRoot, bassRoot + 5, bassRoot + 7];
  const noteCount = 6 + Math.floor(Math.random() * 4);
  const durations = [0.5, 1.0, 1.0, 2.0];
  const notes     = [];
  let time        = 0;

  for (let i = 0; i < noteCount; i++) {
    let pitch;
    if (i < 4) {
      // Use the root interval of each chord in the progression
      const chordRootOffset = theory.chords[i % theory.chords.length][0];
      pitch = bassRoot + chordRootOffset;
    } else {
      pitch = pick(pool);
    }
    const duration = pick(durations);
    const velocity = 85 + Math.floor(Math.random() * 15);
    notes.push({ pitch, startTime: time, endTime: time + duration, velocity });
    time += duration;
  }

  return { notes, totalTime: time };
}

// ─── generateChordProgression ────────────────────────────────────────────────

function generateChordProgression(mood, totalTime) {
  const theory    = MOOD_THEORY[mood];
  const notes     = [];
  const slotCount = Math.ceil(totalTime / 2);

  for (let i = 0; i < slotCount; i++) {
    // Cycle through mood's chord array
    const chordIntervals = theory.chords[i % theory.chords.length];
    // Chord root shifts along scale degrees for harmonic motion
    const chordRoot = theory.root + theory.scale[Math.floor(i * 1.7) % theory.scale.length];

    chordIntervals.forEach(interval => {
      notes.push({
        pitch:     chordRoot + interval,
        startTime: i * 2.0,
        endTime:   i * 2.0 + 1.9,
        velocity:  38,
      });
    });
  }

  return { notes, totalTime };
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

// ─── initModel ───────────────────────────────────────────────────────────────

const CHECKPOINT_URL =
  'https://storage.googleapis.com/magentadata/js/checkpoints/melody_rnn/basic_rnn';

export async function initModel() {
  let waited = 0;
  while (!window.core && waited < 10000) {
    await new Promise(resolve => setTimeout(resolve, 200));
    waited += 200;
  }

  if (!window.core) {
    console.error('[MelodyAI] window.core is undefined after 10s wait.');
    console.error('[MelodyAI] Check that index.html has the Magenta CDN script tag in <body> before main.jsx.');
    return null;
  }

  console.log('[MelodyAI] window.core loaded:', Object.keys(window.core));

  if (!window.core.MelodyRNN) {
    console.error('[MelodyAI] window.core.MelodyRNN not found. Keys available:', Object.keys(window.core));
    return null;
  }

  try {
    console.log('[MelodyAI] Loading MelodyRNN checkpoint...');
    const model = new window.core.MelodyRNN(CHECKPOINT_URL);
    await model.initialize();
    console.log('[MelodyAI] MelodyRNN loaded and ready.');
    return model;
  } catch (err) {
    console.error('[MelodyAI] MelodyRNN failed to initialize:', err);
    return null;
  }
}

// ─── generateMelody ──────────────────────────────────────────────────────────

export async function generateMelody({ mood, model, drumStyle, layers }) {
  const m           = mood ?? 'happy';
  const steps       = 32 + Math.floor(Math.random() * 24);
  const temperature = getMoodTemperature(m);

  let lead = null;

  if (model && window.core && window.core.sequences) {
    try {
      const seed      = buildRandomSeedFromMood(m);
      const quantized = window.core.sequences.quantizeNoteSequence(seed, 4);
      console.log('[MelodyAI] Attempting Magenta generation...', { steps, temperature });
      const result = await model.continueSequence(quantized, steps, temperature);
      if (result && result.notes && result.notes.length > 0) {
        lead = result;
        console.log('[MelodyAI] Magenta succeeded.', { notes: result.notes.length });
      } else {
        console.warn('[MelodyAI] Magenta returned empty sequence. Using algorithmic fallback.');
      }
    } catch (err) {
      console.warn('[MelodyAI] Magenta threw an error. Using algorithmic fallback.', err);
    }
  } else {
    console.warn('[MelodyAI] Skipping Magenta — model or window.core unavailable.', {
      model:      !!model,
      windowCore: !!window.core,
      sequences:  !!(window.core && window.core.sequences),
    });
  }

  if (!lead) {
    lead = generateLeadMelody(m);
    console.log('[MelodyAI] Algorithmic lead generated.', { notes: lead.notes.length });
  }

  const totalTime = lead.totalTime ?? (lead.notes?.length > 0
    ? Math.max(...lead.notes.map(n => n.endTime ?? 0))
    : 8);

  const counter = generateCounterMelody(m);
  const bass    = generateBassLine(m);
  const chords  = generateChordProgression(m, totalTime);
  const drums   = generateDrumPattern(drumStyle ?? 'four_on_floor', totalTime);

  console.log('[MelodyAI] Generated', {
    mood: m,
    temperature: +temperature.toFixed(3),
    steps,
    drumStyle:    drumStyle ?? 'four_on_floor',
    layers:       layers    ?? 'standard',
    scale:        MOOD_THEORY[m].description,
    leadNotes:    lead.notes?.length ?? 0,
    counterNotes: counter.notes.length,
    bassNotes:    bass.notes.length,
    chordNotes:   chords.notes.length,
    drumNotes:    drums.notes.length,
    totalTime:    totalTime.toFixed(2) + 's',
  });

  if (layers === 'minimal') {
    return { lead, counter: null, bass: null, chords, drums };
  }

  return { lead, counter, bass, chords, drums };
}

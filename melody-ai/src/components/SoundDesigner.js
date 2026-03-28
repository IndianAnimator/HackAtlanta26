// ─── helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// ─── export ───────────────────────────────────────────────────────────────────

export function generateSynthPatch(mood) {
  const m = mood ?? 'happy';

  // ── WAVEFORM ──────────────────────────────────────────────────────────────

  const waveformPools = {
    happy:      ['square','square','square','triangle','triangle'],
    sad:        ['sine','sine','sine','triangle','triangle'],
    jazz:       ['sine','sine','sine','triangle','triangle'],
    classical:  ['triangle','triangle','triangle','triangle','sine'],
    lofi:       ['sawtooth','sawtooth','sawtooth','square','square'],
    epic:       ['sawtooth','sawtooth','sawtooth','square','square'],
    romantic:   ['sine','sine','sine','triangle','triangle'],
    mysterious: ['triangle','triangle','triangle','sawtooth','sawtooth'],
  };
  const waveform = pick(waveformPools[m] ?? waveformPools.happy);

  // ── FREQUENCY ─────────────────────────────────────────────────────────────

  const freqBounds = {
    happy:      [400,  900],
    sad:        [200,  500],
    jazz:       [300,  700],
    classical:  [250,  600],
    lofi:       [150,  400],
    epic:       [100,  300],
    romantic:   [200,  500],
    mysterious: [200,  500],
  };
  const [fMin, fMax] = freqBounds[m] ?? [200, 800];
  const frequency = rand(fMin, fMax);

  // ── DETUNE ────────────────────────────────────────────────────────────────

  const detuneBounds = {
    classical: [0.0, 0.02],
    lofi:      [0.04, 0.1],
  };
  const [dtMin, dtMax] = detuneBounds[m] ?? [0.01, 0.05];
  const detune = rand(dtMin, dtMax);

  // ── UNISON ────────────────────────────────────────────────────────────────

  const unisonBounds = {
    classical: [1, 2],
    jazz:      [2, 3],
    lofi:      [2, 4],
    happy:     [3, 6],
    epic:      [4, 8],
  };
  const [uMin, uMax] = unisonBounds[m] ?? [2, 4];
  const unison = uMin + Math.floor(Math.random() * (uMax - uMin + 1));

  // ── FILTER ────────────────────────────────────────────────────────────────

  const filterTypePools = {
    lofi:      ['lowpass'],
    classical: ['lowpass'],
    jazz:      ['bandpass','bandpass','lowpass'],
    epic:      ['lowpass'],
  };
  const filterTypePool = filterTypePools[m] ?? ['lowpass', 'highpass', 'bandpass'];
  const filterType = pick(filterTypePool);

  const cutoffBounds = {
    happy:      [2000, 8000],
    sad:        [500,  2000],
    jazz:       [800,  4000],
    classical:  [1000, 5000],
    lofi:       [300,  1200],
    epic:       [400,  2000],
    romantic:   [600,  2500],
    mysterious: [300,  1500],
  };
  const [cMin, cMax] = cutoffBounds[m] ?? [500, 5000];
  const cutoff = rand(cMin, cMax);

  const resonanceBounds = {
    lofi:      [0.5, 0.9],
    epic:      [0.5, 0.9],
    classical: [0.1, 0.3],
    romantic:  [0.1, 0.3],
  };
  const [rMin, rMax] = resonanceBounds[m] ?? [0.2, 0.6];
  const resonance = rand(rMin, rMax);

  // ── ENVELOPE ──────────────────────────────────────────────────────────────

  const envBounds = {
    happy:      { attack:[0.01,0.05],  decay:[0.1,0.3],  sustain:[0.5,0.8],  release:[0.2,0.5]  },
    sad:        { attack:[0.3,0.8],    decay:[0.3,0.8],  sustain:[0.6,0.9],  release:[1.0,3.0]  },
    jazz:       { attack:[0.01,0.03],  decay:[0.1,0.4],  sustain:[0.4,0.7],  release:[0.2,0.6]  },
    classical:  { attack:[0.05,0.2],   decay:[0.2,0.6],  sustain:[0.5,0.8],  release:[0.5,1.5]  },
    lofi:       { attack:[0.05,0.2],   decay:[0.2,0.5],  sustain:[0.4,0.7],  release:[0.5,1.0]  },
    epic:       { attack:[0.1,0.4],    decay:[0.2,0.6],  sustain:[0.6,0.9],  release:[0.5,2.0]  },
    romantic:   { attack:[0.1,0.5],    decay:[0.3,0.8],  sustain:[0.6,0.9],  release:[1.0,2.5]  },
    mysterious: { attack:[0.2,0.6],    decay:[0.4,1.0],  sustain:[0.4,0.7],  release:[1.0,3.0]  },
  };
  const env = envBounds[m] ?? envBounds.happy;
  const attack  = rand(env.attack[0],  env.attack[1]);
  const decay   = rand(env.decay[0],   env.decay[1]);
  const sustain = rand(env.sustain[0], env.sustain[1]);
  const release = rand(env.release[0], env.release[1]);

  // ── LFO ───────────────────────────────────────────────────────────────────

  const lfoRateBounds = {
    happy:      [3,   8  ],
    sad:        [0.2, 0.8],
    lofi:       [0.3, 1.0],
    epic:       [1,   4  ],
  };
  const [lrMin, lrMax] = lfoRateBounds[m] ?? [0.5, 3.0];
  const lfoRate = rand(lrMin, lrMax);

  const lfoDepthBounds = {
    happy:     [0.3, 0.7],
    sad:       [0.5, 0.9],
    lofi:      [0.4, 0.8],
    classical: [0.1, 0.3],
  };
  const [ldMin, ldMax] = lfoDepthBounds[m] ?? [0.2, 0.6];
  const lfoDepth = rand(ldMin, ldMax);

  const lfoTargetPools = {
    lofi:       ['filter','filter','filter','pitch','amplitude'],
    happy:      ['amplitude','amplitude','amplitude','pitch','filter'],
    mysterious: ['pitch','pitch','pitch','filter','amplitude'],
    epic:       ['pitch','pitch','pitch','filter','amplitude'],
  };
  const lfoTargetPool = lfoTargetPools[m] ?? ['pitch','filter','amplitude'];
  const lfoTarget = pick(lfoTargetPool);

  // ── EFFECTS ───────────────────────────────────────────────────────────────

  const reverbBounds = {
    classical:  [0.5, 0.9],
    romantic:   [0.5, 0.9],
    jazz:       [0.4, 0.7],
    lofi:       [0.3, 0.6],
    happy:      [0.1, 0.4],
    epic:       [0.4, 0.8],
    mysterious: [0.6, 1.0],
    sad:        [0.5, 0.9],
  };
  const [rvMin, rvMax] = reverbBounds[m] ?? [0.2, 0.6];
  const reverb = rand(rvMin, rvMax);

  const delayBounds = {
    jazz:  [0.3, 0.7],
    lofi:  [0.2, 0.5],
    epic:  [0.1, 0.4],
  };
  const [dlMin, dlMax] = delayBounds[m] ?? [0.0, 0.3];
  const delay = rand(dlMin, dlMax);

  const distBounds = {
    lofi:      [0.3, 0.7],
    epic:      [0.2, 0.5],
    classical: [0.0, 0.05],
    romantic:  [0.0, 0.05],
  };
  const [distMin, distMax] = distBounds[m] ?? [0.0, 0.2];
  const distortion = rand(distMin, distMax);

  // ── MACROS ────────────────────────────────────────────────────────────────

  const brightness = cutoff / 10000;
  const movement   = (lfoDepth * lfoRate) / 20;
  const space      = (reverb + delay) / 2;

  // ── CHARACTER TAG ─────────────────────────────────────────────────────────

  let character;
  if (waveform === 'sine' && attack > 0.2 && reverb > 0.6) {
    character = 'airy pad';
  } else if (waveform === 'sine' && sustain > 0.7 && distortion < 0.1) {
    character = 'warm pad';
  } else if (waveform === 'sawtooth' && resonance > 0.6 && distortion > 0.4) {
    character = 'harsh bass';
  } else if (waveform === 'sawtooth' && attack < 0.05 && sustain < 0.4) {
    character = 'gritty stab';
  } else if (waveform === 'square' && attack < 0.05 && reverb > 0.2) {
    character = 'plucky lead';
  } else if (waveform === 'triangle' && attack > 0.15 && reverb > 0.5) {
    character = 'glassy bell';
  } else if (waveform === 'triangle') {
    character = 'clean lead';
  } else if (distortion > 0.5 && reverb < 0.3) {
    character = 'dirty synth';
  } else if (reverb > 0.6 && delay > 0.3 && lfoRate < 1.5) {
    character = 'ambient wash';
  } else {
    character = 'plucky lead';
  }

  const patch = {
    oscillator: { waveform, frequency, detune, unison },
    filter:     { type: filterType, cutoff, resonance },
    envelope:   { attack, decay, sustain, release },
    lfo:        { rate: lfoRate, depth: lfoDepth, target: lfoTarget },
    effects:    { reverb, delay, distortion },
    macros:     { brightness, movement, space },
    character,
  };

  console.log('[SoundDesigner] Patch generated:', { mood: m, character, waveform, filter: filterType, envelope: { attack: +attack.toFixed(3), decay: +decay.toFixed(3), sustain: +sustain.toFixed(3), release: +release.toFixed(3) } });
  return patch;
}

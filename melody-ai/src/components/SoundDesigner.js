// ─── helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// ─── Claude patch generator ───────────────────────────────────────────────────

async function composePatchWithClaude(mood) {
  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: `You are a sound design AI that generates parameters for a virtual synthesizer similar to Serum.

Your goal is to create a UNIQUE, musically useful sound for the mood: "${mood}".

Return ONLY a JSON object with randomized but coherent parameter values.

Constraints:
- Keep values within realistic audio ranges
- Ensure parameters work together musically (not pure random noise)
- Each output must sound noticeably different from previous ones
- Prefer interesting variation (movement, modulation)
- Match the mood: ${mood}

Parameters to generate:

OSCILLATOR:
waveform: one of ["sine", "square", "sawtooth", "triangle"]
frequency: (20–2000 Hz)
detune: (0–0.1)
unison: (1–8 voices)

FILTER:
type: one of ["lowpass", "highpass", "bandpass"]
cutoff: (100–10000 Hz)
resonance: (0.1–1.0)

ENVELOPE (ADSR):
attack: (0.001–1.0 sec)
decay: (0.01–2.0 sec)
sustain: (0–1)
release: (0.01–3.0 sec)

LFO:
rate: (0.1–20 Hz)
depth: (0–1)
target: one of ["pitch", "filter", "amplitude"]

EFFECTS:
reverb: (0–1)
delay: (0–1)
distortion: (0–1)

MACRO CONTROLS:
brightness: (0–1)
movement: (0–1)
space: (0–1)

CHARACTER: a short 2-word description like "warm pad", "harsh bass", "plucky lead"

Return JSON only, no markdown, no explanation. Exact shape:
{
  "oscillator": { "waveform": "triangle", "frequency": 440, "detune": 0.02, "unison": 2 },
  "filter": { "type": "lowpass", "cutoff": 2000, "resonance": 0.4 },
  "envelope": { "attack": 0.05, "decay": 0.2, "sustain": 0.6, "release": 0.5 },
  "lfo": { "rate": 1.5, "depth": 0.3, "target": "filter" },
  "effects": { "reverb": 0.3, "delay": 0.2, "distortion": 0.0 },
  "macros": { "brightness": 0.6, "movement": 0.4, "space": 0.3 },
  "character": "warm pad"
}`
          }]
        }]
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(`API ${response.status}`)
    const text = data.content[0].text.trim().replace(/```json|```/g, '')
    const patch = JSON.parse(text)
    if (!patch.oscillator || !patch.filter || !patch.envelope) throw new Error('incomplete patch')
    console.log('[SoundDesigner] Claude patch:', patch.character)
    return patch
  } catch (err) {
    console.warn('[SoundDesigner] Claude failed, using algorithmic fallback:', err.message)
    return null
  }
}

// ─── Algorithmic fallback ─────────────────────────────────────────────────────

function algorithmicPatch(mood) {
  const m = mood ?? 'happy';

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

  const freqBounds = {
    happy: [400, 900], sad: [200, 500], jazz: [300, 700],
    classical: [250, 600], lofi: [150, 400], epic: [100, 300],
    romantic: [200, 500], mysterious: [200, 500],
  };
  const [fMin, fMax] = freqBounds[m] ?? [200, 800];
  const frequency = rand(fMin, fMax);
  const detune = rand(0.01, 0.05);
  const unison = 2 + Math.floor(Math.random() * 3);

  const filterTypePools = {
    lofi: ['lowpass'], classical: ['lowpass'],
    jazz: ['bandpass','bandpass','lowpass'], epic: ['lowpass'],
  };
  const filterType = pick(filterTypePools[m] ?? ['lowpass', 'highpass', 'bandpass']);

  const cutoffBounds = {
    happy: [2000, 8000], sad: [500, 2000], jazz: [800, 4000],
    classical: [1000, 5000], lofi: [300, 1200], epic: [400, 2000],
    romantic: [600, 2500], mysterious: [300, 1500],
  };
  const [cMin, cMax] = cutoffBounds[m] ?? [500, 5000];
  const cutoff = rand(cMin, cMax);
  const resonance = rand(0.2, 0.6);

  const envBounds = {
    happy:      { attack:[0.01,0.05], decay:[0.1,0.3],  sustain:[0.5,0.8], release:[0.2,0.5] },
    sad:        { attack:[0.3,0.8],   decay:[0.3,0.8],  sustain:[0.6,0.9], release:[1.0,3.0] },
    jazz:       { attack:[0.01,0.03], decay:[0.1,0.4],  sustain:[0.4,0.7], release:[0.2,0.6] },
    classical:  { attack:[0.05,0.2],  decay:[0.2,0.6],  sustain:[0.5,0.8], release:[0.5,1.5] },
    lofi:       { attack:[0.05,0.2],  decay:[0.2,0.5],  sustain:[0.4,0.7], release:[0.5,1.0] },
    epic:       { attack:[0.1,0.4],   decay:[0.2,0.6],  sustain:[0.6,0.9], release:[0.5,2.0] },
    romantic:   { attack:[0.1,0.5],   decay:[0.3,0.8],  sustain:[0.6,0.9], release:[1.0,2.5] },
    mysterious: { attack:[0.2,0.6],   decay:[0.4,1.0],  sustain:[0.4,0.7], release:[1.0,3.0] },
  };
  const env = envBounds[m] ?? envBounds.happy;
  const attack  = rand(env.attack[0],  env.attack[1]);
  const decay   = rand(env.decay[0],   env.decay[1]);
  const sustain = rand(env.sustain[0], env.sustain[1]);
  const release = rand(env.release[0], env.release[1]);

  const lfoRate   = rand(0.5, 4.0);
  const lfoDepth  = rand(0.2, 0.6);
  const lfoTarget = pick(['pitch', 'filter', 'amplitude']);

  const reverbBounds = {
    classical: [0.5, 0.9], romantic: [0.5, 0.9], jazz: [0.4, 0.7],
    lofi: [0.3, 0.6], happy: [0.1, 0.4], epic: [0.4, 0.8],
    mysterious: [0.6, 1.0], sad: [0.5, 0.9],
  };
  const [rvMin, rvMax] = reverbBounds[m] ?? [0.2, 0.6];
  const reverb = rand(rvMin, rvMax);
  const delay = rand(0.0, 0.3);
  const distortion = rand(0.0, 0.2);

  const brightness = cutoff / 10000;
  const movement   = (lfoDepth * lfoRate) / 20;
  const space      = (reverb + delay) / 2;

  let character = 'plucky lead';
  if (waveform === 'sine' && attack > 0.2 && reverb > 0.6) character = 'airy pad';
  else if (waveform === 'sine' && sustain > 0.7) character = 'warm pad';
  else if (waveform === 'sawtooth' && resonance > 0.6) character = 'harsh bass';
  else if (waveform === 'square' && attack < 0.05) character = 'plucky lead';
  else if (waveform === 'triangle' && attack > 0.15 && reverb > 0.5) character = 'glassy bell';

  return {
    oscillator: { waveform, frequency, detune, unison },
    filter:     { type: filterType, cutoff, resonance },
    envelope:   { attack, decay, sustain, release },
    lfo:        { rate: lfoRate, depth: lfoDepth, target: lfoTarget },
    effects:    { reverb, delay, distortion },
    macros:     { brightness, movement, space },
    character,
  };
}

// ─── export ───────────────────────────────────────────────────────────────────

export async function generateSynthPatch(mood) {
  const patch = await composePatchWithClaude(mood) ?? algorithmicPatch(mood);
  console.log('[SoundDesigner] Patch generated:', { mood, character: patch.character });
  return patch;
}

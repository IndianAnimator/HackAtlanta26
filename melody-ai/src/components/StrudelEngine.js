import { controls, repl, stack as stackPatterns, setStringParser } from '@strudel/core'
import { initAudioOnFirstClick, getAudioContext, webaudioOutput, doughsamples } from '@strudel/webaudio'
import { mini } from '@strudel/mini'

setStringParser(mini)

const { note, s } = controls

const clamp01 = (value) => Math.max(0, Math.min(1, value))

const MOOD_LIBRARY = {
  happy: {
    title: 'Sunburst Groove',
    lead: {
      motif: 'c5 e5 g5 e5 d5 g5 a5 g5',
      sound: 'supersaw',
      slow: 1,
      gain: 0.95,
      room: 0.24,
      pan: '<0 .65>',
    },
    counter: {
      motif: '<g4 b4> ~ <a4 c5> g4 e4 d4 g4',
      sound: 'triangle',
      slow: 1.5,
      gain: 0.6,
      pan: '<.75 .25>',
    },
    chords: {
      motif: '[c4,e4,g4] [f4,a4,c5] [g4,b4,d5] [a4,c5,e5]',
      sound: 'square',
      slow: 2,
      room: 0.35,
    },
    bass: {
      motif: 'c2 g2 a2 f2',
      sound: 'sawtooth',
      slow: 2,
      gain: 0.85,
    },
    drums: {
      pattern: 'bd*2 sd hh*2,hh*8 oh*2',
      bank: 'tr808',
      gain: 0.9,
    },
    macros: { brightness: 0.82, movement: 0.55, space: 0.32 },
  },
  sad: {
    title: 'Velvet Echo',
    lead: {
      motif: 'a4 c5 e5 g5 f5 e5 d5 c5',
      sound: 'sine',
      slow: 1.2,
      gain: 0.75,
      room: 0.4,
      pan: '<0.2 0.8>',
    },
    counter: {
      motif: '<e4 g4> ~ f4 ~ e4 c4 d4 a3',
      sound: 'triangle',
      slow: 2,
      gain: 0.55,
    },
    chords: {
      motif: '[a3,c4,e4] [f3,a3,c4] [d3,f3,a3] [e3,g3,b3]',
      sound: 'triangle',
      slow: 3,
      room: 0.55,
    },
    bass: {
      motif: 'a2 e2 f2 d2',
      sound: 'sine',
      slow: 2,
      gain: 0.7,
    },
    drums: {
      pattern: 'bd ~ sd ~,hh*4',
      bank: 'tr707',
      gain: 0.65,
    },
    macros: { brightness: 0.45, movement: 0.32, space: 0.58 },
  },
  jazz: {
    title: 'Blue Lantern',
    lead: {
      motif: 'bb4 d5 f5 a5 g5 f5 d5 bb4',
      sound: 'triangle',
      slow: 1,
      gain: 0.8,
      pan: '<0.3 0.7>',
    },
    counter: {
      motif: 'f4 ~ g4 ~ a4 ~ bb4 ~',
      sound: 'sine',
      slow: 1.5,
      gain: 0.55,
    },
    chords: {
      motif: '[bb3,d4,f4,a4] [eb4,g4,bb4,d5] [g3,bb3,d4,f4] [c4,eb4,g4,bb4]',
      sound: 'square',
      slow: 2,
      room: 0.4,
    },
    bass: {
      motif: 'bb2 f2 g2 c3',
      sound: 'sawtooth',
      slow: 1.5,
      gain: 0.78,
    },
    drums: {
      pattern: 'bd sd hh*2,hh*8 rim*2',
      bank: 'tr909',
      gain: 0.75,
    },
    macros: { brightness: 0.62, movement: 0.58, space: 0.38 },
  },
  classical: {
    title: 'Sonata Bloom',
    lead: {
      motif: 'c5 d5 e5 f5 g5 a5 b5 c6',
      sound: 'sine',
      slow: 1.2,
      gain: 0.7,
      room: 0.3,
    },
    counter: {
      motif: 'g4 f4 e4 d4 c4 b3 a3 g3',
      sound: 'triangle',
      slow: 1.2,
      gain: 0.55,
    },
    chords: {
      motif: '[c4,e4,g4] [g3,d4,g4,b4] [a3,c4,e4] [f3,a3,c4]',
      sound: 'triangle',
      slow: 2,
      room: 0.42,
    },
    bass: {
      motif: 'c2 g2 a2 f2',
      sound: 'triangle',
      slow: 2,
      gain: 0.65,
    },
    drums: {
      pattern: 'bd*2 ~ ~ ~,hh*4',
      bank: 'orch',
      gain: 0.55,
    },
    macros: { brightness: 0.58, movement: 0.4, space: 0.36 },
  },
  lofi: {
    title: 'Rainy Desk',
    lead: {
      motif: 'd4 f4 g4 a4 g4 e4 d4 f4',
      sound: 'sine',
      slow: 1.4,
      gain: 0.6,
      room: 0.45,
    },
    counter: {
      motif: '<a3 c4> ~ g3 ~ f3 ~ e3 ~',
      sound: 'triangle',
      slow: 1.6,
      gain: 0.45,
    },
    chords: {
      motif: '[d3,f3,a3] [g3,b3,d4] [c3,e3,g3] [bb2,d3,f3]',
      sound: 'square',
      slow: 2.5,
      room: 0.5,
    },
    bass: {
      motif: 'd2 a2 bb1 g2',
      sound: 'sine',
      slow: 2,
      gain: 0.6,
    },
    drums: {
      pattern: 'bd sd,hh*6 cp',
      bank: 'linndrum',
      gain: 0.6,
    },
    macros: { brightness: 0.4, movement: 0.35, space: 0.5 },
  },
  epic: {
    title: 'Storm Surge',
    lead: {
      motif: 'd5 f5 a5 c6 a5 g5 f5 d5',
      sound: 'supersaw',
      slow: 0.8,
      gain: 1,
      room: 0.28,
      pan: '<0.35 0.65>',
    },
    counter: {
      motif: '<a4 d5> g4 <f4 c5> g4',
      sound: 'sawtooth',
      slow: 1.2,
      gain: 0.75,
    },
    chords: {
      motif: '[d4,f4,a4] [bb3,d4,f4] [g3,a3,d4] [c4,e4,g4]',
      sound: 'sawtooth',
      slow: 1.5,
      room: 0.32,
    },
    bass: {
      motif: 'd2 a1 bb1 g1',
      sound: 'square',
      slow: 1.5,
      gain: 0.92,
    },
    drums: {
      pattern: 'bd*2 cp hh*2,oh*2 crash*2',
      bank: 'tr909',
      gain: 0.95,
    },
    macros: { brightness: 0.88, movement: 0.72, space: 0.35 },
  },
  romantic: {
    title: 'Rose Hues',
    lead: {
      motif: 'g5 b5 d6 b5 a5 g5 e5 d5',
      sound: 'triangle',
      slow: 1,
      gain: 0.8,
      room: 0.36,
    },
    counter: {
      motif: '<d5 g5> <c5 e5> <b4 d5> <a4 c5>',
      sound: 'sine',
      slow: 1.4,
      gain: 0.55,
    },
    chords: {
      motif: '[g3,b3,d4] [e3,g3,b3] [c4,e4,g4] [d4,f#4,a4]',
      sound: 'triangle',
      slow: 2,
      room: 0.48,
    },
    bass: {
      motif: 'g2 d2 e2 c2',
      sound: 'sine',
      slow: 2,
      gain: 0.68,
    },
    drums: {
      pattern: 'bd ~ sd ~,hh*4 oh',
      bank: 'tr707',
      gain: 0.6,
    },
    macros: { brightness: 0.6, movement: 0.44, space: 0.52 },
  },
  mysterious: {
    title: 'Labyrinth Mist',
    lead: {
      motif: 'c5 db5 g5 ab5 f5 eb5 db5 c5',
      sound: 'sine',
      slow: 1,
      gain: 0.76,
      room: 0.5,
      pan: '<0.1 0.9>',
    },
    counter: {
      motif: '<g4 bb4> ~ <eb4 gb4> ~',
      sound: 'triangle',
      slow: 1.4,
      gain: 0.52,
    },
    chords: {
      motif: '[c4,eb4,gb4] [f4,ab4,c5] [gb3,bb3,db4] [bb3,db4,f4]',
      sound: 'square',
      slow: 2,
      room: 0.55,
    },
    bass: {
      motif: 'c2 gb1 bb1 db2',
      sound: 'sine',
      slow: 1.8,
      gain: 0.65,
    },
    drums: {
      pattern: 'bd ~ cp ~,hh*6 rim',
      bank: 'linndrum',
      gain: 0.62,
    },
    macros: { brightness: 0.5, movement: 0.48, space: 0.6 },
  },
}

const FLAVOR_OVERRIDES = {
  default: { label: 'Default' },
  nocturne: {
    label: 'Nocturne',
    keywords: ['night', 'space', 'moon', 'star', 'galaxy', 'void', 'midnight'],
    lead: { sound: 'triangle', room: 0.65 },
    counter: { pan: '<0.2 0.8>' },
    chords: { room: 0.7 },
    drums: { pattern: 'bd ~ sd hh,hh*4 oh', bank: 'linndrum', gain: 0.6 },
    macros: { brightness: 0.55, movement: 0.38, space: 0.7 },
    filter: 'bandpass',
    delay: 0.28,
  },
  lofi: {
    label: 'Lo-Fi',
    keywords: ['coffee', 'rain', 'study', 'lofi', 'cafe', 'cozy'],
    lead: { sound: 'sine', room: 0.55, slow: 1.5 },
    drums: { pattern: 'bd sd,hh*6 cp', bank: 'linndrum', gain: 0.55 },
    macros: { brightness: 0.42, movement: 0.34, space: 0.55 },
    filter: 'lowpass',
    delay: 0.32,
  },
  battle: {
    label: 'Battle',
    keywords: ['battle', 'boss', 'fight', 'chase', 'arena'],
    lead: { sound: 'supersaw', slow: 0.8 },
    drums: { pattern: 'bd*2 cp hh*2,oh*2 crash*2', bank: 'tr909', gain: 0.95 },
    macros: { brightness: 0.9, movement: 0.78, space: 0.3 },
    distortion: 0.25,
  },
  sunset: {
    label: 'Sunset',
    keywords: ['sunset', 'ocean', 'beach', 'golden', 'dusk'],
    lead: { sound: 'sawtooth', room: 0.4 },
    drums: { pattern: 'bd sd hh*2,oh*2', bank: 'tr808', gain: 0.78 },
    macros: { brightness: 0.72, movement: 0.5, space: 0.48 },
    delay: 0.35,
  },
}

const detectFlavor = (theme = '') => {
  const text = theme.toLowerCase()
  for (const [key, flavor] of Object.entries(FLAVOR_OVERRIDES)) {
    if (key === 'default' || !flavor.keywords) continue
    if (flavor.keywords.some((word) => text.includes(word))) {
      return key
    }
  }
  return 'default'
}

const clonePreset = (preset) => JSON.parse(JSON.stringify(preset))

const mergeFlavor = (preset, flavorKey) => {
  const flavor = FLAVOR_OVERRIDES[flavorKey] ?? FLAVOR_OVERRIDES.default
  const applyLayer = (layer, overrides = {}) => {
    const merged = { ...layer, ...overrides }
    if (overrides.room != null) merged.room = clamp01(overrides.room)
    if (overrides.gain != null) merged.gain = clamp01(overrides.gain)
    if (overrides.slow != null) merged.slow = overrides.slow
    if (overrides.sound) merged.sound = overrides.sound
    if (overrides.pan) merged.pan = overrides.pan
    return merged
  }

  const macros = {
    brightness: clamp01(flavor.macros?.brightness ?? preset.macros.brightness),
    movement: clamp01(flavor.macros?.movement ?? preset.macros.movement),
    space: clamp01(flavor.macros?.space ?? preset.macros.space),
  }

  return {
    ...preset,
    flavorLabel: flavor.label ?? 'Default',
    lead: applyLayer(preset.lead, flavor.lead),
    counter: applyLayer(preset.counter, flavor.counter),
    chords: applyLayer(preset.chords, flavor.chords),
    bass: applyLayer(preset.bass, flavor.bass),
    drums: applyLayer(preset.drums, flavor.drums),
    macros,
    filterType: flavor.filter,
    delayAmount: flavor.delay,
    distortion: flavor.distortion,
  }
}

const applyModifiers = (pattern, layer) => {
  let result = pattern
  if (layer.sound) result = result.s(layer.sound)
  if (layer.slow && layer.slow !== 1) result = result.slow(layer.slow)
  if (layer.fast && layer.fast !== 1) result = result.fast(layer.fast)
  if (layer.gain != null) result = result.gain(layer.gain)
  if (layer.room != null) result = result.room(layer.room)
  if (layer.pan) result = result.pan(layer.pan)
  if (layer.attack) result = result.attack(layer.attack)
  if (layer.decay) result = result.decay(layer.decay)
  if (layer.sustain != null) result = result.sustain(layer.sustain)
  if (layer.release) result = result.release(layer.release)
  return result
}

const buildLeadLayer = (layer) => applyModifiers(note(layer.motif), layer)
const buildDrumLayer = (layer) => {
  let pattern = s(layer.pattern)
  if (layer.bank) pattern = pattern.bank(layer.bank)
  if (layer.gain != null) pattern = pattern.gain(layer.gain)
  if (layer.room != null) pattern = pattern.room(layer.room)
  return pattern
}

const buildPatchDescriptor = (preset, mood) => {
  const { macros, flavorLabel, filterType, delayAmount, distortion } = preset
  const leadWave = preset.lead.sound ?? 'sawtooth'
  return {
    oscillator: {
      waveform: leadWave,
      frequency: 440,
      detune: 0.01 + macros.brightness * 0.02,
      unison: 2 + Math.round(macros.movement * 2),
    },
    filter: {
      type: filterType ?? 'lowpass',
      cutoff: Math.round(800 + macros.brightness * 6000),
      resonance: 0.3 + macros.movement * 0.3,
    },
    envelope: {
      attack: 0.02 + macros.space * 0.2,
      decay: 0.2 + macros.movement * 0.3,
      sustain: 0.5 + macros.movement * 0.3,
      release: 0.4 + macros.space * 0.5,
    },
    lfo: {
      rate: 0.4 + macros.movement * 3,
      depth: 0.25 + macros.movement * 0.4,
      target: filterType === 'bandpass' ? 'filter' : 'amplitude',
    },
    effects: {
      reverb: macros.space,
      delay: delayAmount ?? 0.18 + macros.space * 0.2,
      distortion: distortion ?? 0.08 + macros.brightness * 0.1,
    },
    macros,
    character: `${flavorLabel ?? 'Strudel'} · ${preset.title ?? mood}`,
  }
}

export const buildStrudelScore = ({ mood, theme }) => {
  const basePreset = MOOD_LIBRARY[mood] ? clonePreset(MOOD_LIBRARY[mood]) : clonePreset(MOOD_LIBRARY.happy)
  const flavorKey = detectFlavor(theme ?? '')
  const preset = mergeFlavor(basePreset, flavorKey)

  const leadPattern = buildLeadLayer(preset.lead)
  const counterPattern = buildLeadLayer(preset.counter)
  const chordPattern = buildLeadLayer(preset.chords)
  const bassPattern = buildLeadLayer(preset.bass)
  const drumPattern = buildDrumLayer(preset.drums)

  const arrangement = stackPatterns(leadPattern, counterPattern, chordPattern, bassPattern, drumPattern)
  const patch = buildPatchDescriptor(preset, mood)

  return {
    arrangement,
    patch,
    flavor: preset.flavorLabel,
    description: `${preset.title} · ${preset.flavorLabel}`,
  }
}

let schedulerPromise
let sampleLibraryPromise

const ensureSamples = () => {
  if (typeof window === 'undefined') return Promise.resolve()
  if (!sampleLibraryPromise) {
    sampleLibraryPromise = doughsamples('github:tidalcycles/dirt-samples').catch((err) => {
      console.error('[StrudelEngine] Failed to load default samples', err)
      sampleLibraryPromise = null
    })
  }
  return sampleLibraryPromise ?? Promise.resolve()
}

const ensureScheduler = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (!schedulerPromise) {
    schedulerPromise = (async () => {
      initAudioOnFirstClick()
      const ctx = getAudioContext()
      await ensureSamples()
      return repl({
        defaultOutput: webaudioOutput,
        getTime: () => ctx.currentTime,
      })
    })()
  }
  return schedulerPromise
}

export const playStrudelScore = async (pattern, tempo = 110) => {
  if (!pattern) return
  const api = await ensureScheduler()
  if (!api) return
  const cps = (tempo ?? 110) / 240
  api.setCps(cps)
  await api.setPattern(pattern, false)
  api.start()
}

export const stopStrudelPlayback = async () => {
  if (!schedulerPromise) return
  const api = await schedulerPromise
  api?.stop()
}

import MidiWriter from 'midi-writer-js'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const DEFAULT_TICKS_PER_BEAT = 960
const QUARTER_NOTE_UNITS = 0.5 // internal timing units used across generators (0.5 == quarter note)

const clampVelocity = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 80
  return Math.max(15, Math.min(100, Math.round(value)))
}

const midiNumberToPitch = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null
  const midi = Math.max(0, Math.min(127, Math.round(value)))
  const name = NOTE_NAMES[midi % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${name}${octave}`
}

const unitsToTicks = (units, ticksPerBeat = DEFAULT_TICKS_PER_BEAT) => {
  if (typeof units !== 'number' || Number.isNaN(units)) return 0
  const beats = units / QUARTER_NOTE_UNITS
  return Math.max(0, Math.round(beats * ticksPerBeat))
}

const createNoteEvents = (notes = [], channel = 1, ticksPerBeat = DEFAULT_TICKS_PER_BEAT) => {
  if (!Array.isArray(notes)) return []
  return notes
    .map((note) => {
      const pitchName = midiNumberToPitch(note?.pitch)
      if (!pitchName) return null
      const startUnits = typeof note?.startTime === 'number' ? note.startTime : 0
      const endUnits = typeof note?.endTime === 'number' ? note.endTime : startUnits + 0.5
      const durationUnits = Math.max(0.05, endUnits - startUnits)
      const startTicks = unitsToTicks(startUnits, ticksPerBeat)
      const durationTicks = Math.max(1, unitsToTicks(durationUnits, ticksPerBeat))

      return new MidiWriter.NoteEvent({
        pitch: pitchName,
        tick: startTicks,
        duration: `T${durationTicks}`,
        channel,
        velocity: clampVelocity(note?.velocity),
      })
    })
    .filter(Boolean)
}

const createTrackForLayer = ({
  label,
  notes,
  channel = 1,
  instrument = null,
  ticksPerBeat = DEFAULT_TICKS_PER_BEAT,
}) => {
  const events = createNoteEvents(notes, channel, ticksPerBeat)
  if (!events.length) return null

  const track = new MidiWriter.Track()
  track.addEvent(new MidiWriter.TrackNameEvent({ text: label }))
  if (typeof instrument === 'number') {
    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument, channel }))
  }
  track.addEvent(events)
  return track
}

const sanitizeFileName = (theme, mood) => {
  const base = (theme || mood || 'melody').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const stamp = new Date().toISOString().slice(0, 10)
  return `${base || 'melody'}-${stamp}.mid`
}

const appendFilenameSuffix = (filename, suffix) => {
  if (!suffix) return filename
  const safe = suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (!safe) return filename
  if (filename.toLowerCase().endsWith('.mid')) {
    return `${filename.slice(0, -4)}-${safe}.mid`
  }
  return `${filename}-${safe}`
}

const LAYER_CONFIG_MAP = {
  lead: { label: 'Lead', channel: 1, instrument: 81 },
  counter: { label: 'Counter', channel: 2, instrument: 89 },
  chords: { label: 'Chords', channel: 3, instrument: 48 },
  bass: { label: 'Bass', channel: 4, instrument: 34 },
  drums: { label: 'Drums', channel: 10, instrument: null },
}

export const createMidiFile = ({
  lead,
  counter,
  bass,
  chords,
  drums,
  tempo = 110,
  mood = 'happy',
  theme = 'Melody',
  layersToInclude = Object.keys(LAYER_CONFIG_MAP),
  filenameSuffix,
}) => {
  const ticksPerBeat = DEFAULT_TICKS_PER_BEAT

  const metaTrack = new MidiWriter.Track()
  const safeTempo = Math.max(40, Math.min(220, tempo))
  metaTrack.setTempo(safeTempo)
  metaTrack.setTimeSignature(4, 4)
  metaTrack.addEvent(new MidiWriter.TrackNameEvent({ text: 'Melody AI - Timeline' }))
  metaTrack.addEvent(new MidiWriter.TextEvent({ text: `Mood: ${mood}` }))

  const tracks = [metaTrack]

  const layerData = { lead, counter, chords, bass, drums }
  const requestedLayers = (layersToInclude?.length ? layersToInclude : Object.keys(LAYER_CONFIG_MAP))
    .filter((key) => LAYER_CONFIG_MAP[key])

  let hasLayerContent = false
  requestedLayers.forEach((layerKey) => {
    const cfg = LAYER_CONFIG_MAP[layerKey]
    const notes = layerData[layerKey]?.notes
    const track = createTrackForLayer({
      label: cfg.label,
      notes,
      channel: cfg.channel,
      instrument: cfg.instrument,
      ticksPerBeat,
    })
    if (track) {
      tracks.push(track)
      if (!hasLayerContent && Array.isArray(notes) && notes.length > 0) {
        hasLayerContent = true
      }
    }
  })

  if (!hasLayerContent) {
    throw new Error('No musical layers found to include in the MIDI file.')
  }

  const writer = new MidiWriter.Writer(tracks, { ticksPerBeat })
  const buffer = writer.buildFile()
  const filenameWithSuffix = appendFilenameSuffix(sanitizeFileName(theme, mood), filenameSuffix)

  return { buffer, filename: filenameWithSuffix }
}

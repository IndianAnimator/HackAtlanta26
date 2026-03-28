const CHECKPOINT_URL =
  'https://storage.googleapis.com/magentadata/js/checkpoints/melody_rnn/basic_rnn';

const STUB_NOTE_SEQUENCE = {
  notes: [
    { pitch: 60, startTime: 0.0, endTime: 0.5, velocity: 80 },
    { pitch: 62, startTime: 0.5, endTime: 1.0, velocity: 80 },
    { pitch: 64, startTime: 1.0, endTime: 1.5, velocity: 80 },
    { pitch: 65, startTime: 1.5, endTime: 2.0, velocity: 80 },
    { pitch: 67, startTime: 2.0, endTime: 2.5, velocity: 80 },
    { pitch: 69, startTime: 2.5, endTime: 3.0, velocity: 80 },
    { pitch: 71, startTime: 3.0, endTime: 3.5, velocity: 80 },
    { pitch: 72, startTime: 3.5, endTime: 4.0, velocity: 80 },
  ],
  totalTime: 4.0,
  tempos: [{ time: 0, qpm: 120 }],
  quantizationInfo: { stepsPerQuarter: 4 },
};

const MOOD_TEMPERATURE = {
  jazz: 1.2,
  classical: 0.8,
  'lo-fi': 1.0,
  pop: 0.9,
  random: 1.5,
};

export async function initModel() {
  if (!window.core) {
    console.warn('Magenta window.core not available — running in stub mode');
    return null;
  }
  try {
    const model = new window.core.MelodyRNN(CHECKPOINT_URL);
    await model.initialize();
    return model;
  } catch (err) {
    console.error('MelodyRNN init failed:', err);
    return null;
  }
}

export async function generateMelody({ model, seedNotes, mood, steps = 32 }) {
  if (!model || !window.core) {
    return STUB_NOTE_SEQUENCE;
  }

  const temperature = MOOD_TEMPERATURE[mood?.toLowerCase()] ?? 1.0;
  const seedArray = seedNotes && seedNotes.length > 0 ? seedNotes : [60];

  const seedNoteObjects = seedArray.map((pitch, i) => ({
    pitch,
    startTime: i * 0.5,
    endTime: (i + 1) * 0.5,
    velocity: 80,
  }));

  const seedSeq = {
    notes: seedNoteObjects,
    totalTime: seedNoteObjects[seedNoteObjects.length - 1].endTime,
    tempos: [{ time: 0, qpm: 120 }],
    quantizationInfo: { stepsPerQuarter: 4 },
  };

  try {
    const quantized = window.core.sequences.quantizeNoteSequence(seedSeq, 4);
    const result = await model.continueSequence(quantized, steps, temperature);
    return result;
  } catch (err) {
    console.error('generateMelody failed, using stub:', err);
    return STUB_NOTE_SEQUENCE;
  }
}

import * as Tone from 'tone';

// ─── Module-level cleanup array ───────────────────────────────────────────────
let activeNodes = [];

// ─── Main playback export ─────────────────────────────────────────────────────

export async function playMelody({
  lead,
  counter,
  bass,
  chords,
  drums,
  tempo,
  synthPatch,
  onNoteOn,
  onNoteOff,
  onComplete,
}) {
  await Tone.start();

  Tone.Transport.cancel();
  Tone.Transport.stop();
  activeNodes.forEach(node => { try { node.dispose(); } catch (_) {} });

  // Step 1: set BPM before scheduling anything
  Tone.Transport.bpm.value = tempo ?? 120;
  activeNodes = [];

  // All note times are expressed at 120 BPM reference. Scale to actual tempo.
  const timeScale = 120 / (tempo ?? 120);

  // ── Effects chain ────────────────────────────────────────────────────────
  const reverbWet = Math.min(0.4, synthPatch?.effects?.reverb ?? 0.4); // cap — high reverb causes wash
  const delayWet  = synthPatch?.effects?.delay      ?? 0.2;
  const distAmt   = synthPatch?.effects?.distortion ?? 0.0;

  const reverb = new Tone.Reverb({ decay: Math.max(0.5, reverbWet * 6), wet: reverbWet });
  await reverb.ready;

  const delay  = new Tone.FeedbackDelay('8n', delayWet);
  const filter = new Tone.Filter(
    synthPatch?.filter?.cutoff ?? 2000,
    synthPatch?.filter?.type   ?? 'lowpass'
  );

  // Master limiter — prevents all layers from clipping the output
  const limiter = new Tone.Limiter(-3).toDestination();
  activeNodes.push(limiter);

  // Only create distortion if amount is meaningful
  let dist = null;
  if (distAmt > 0.3) {
    dist = new Tone.Distortion(distAmt);
    activeNodes.push(dist);
  }

  // Chain: [dist →] filter → reverb → delay → limiter → Destination
  if (dist) dist.connect(filter);
  filter.connect(reverb);
  reverb.connect(delay);
  delay.connect(limiter);

  activeNodes.push(filter, reverb, delay);

  // ── LFO ──────────────────────────────────────────────────────────────────
  const lfo = new Tone.LFO(
    synthPatch?.lfo?.rate  ?? 1,
    0,
    synthPatch?.lfo?.depth ?? 0.3
  );
  activeNodes.push(lfo);

  // ── Lead synth ───────────────────────────────────────────────────────────
  const leadSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: synthPatch?.oscillator?.waveform ?? 'triangle' },
    envelope: {
      attack:  synthPatch?.envelope?.attack  ?? 0.02,
      decay:   synthPatch?.envelope?.decay   ?? 0.1,
      sustain: synthPatch?.envelope?.sustain ?? 0.6,
      release: synthPatch?.envelope?.release ?? 0.4,
    },
  });
  leadSynth.volume.value = -10;
  leadSynth.connect(dist ?? filter);
  activeNodes.push(leadSynth);

  // Connect LFO after leadSynth exists
  const lfoTarget = synthPatch?.lfo?.target ?? 'pitch';
  if (lfoTarget === 'filter') {
    lfo.connect(filter.frequency);
  } else if (lfoTarget === 'amplitude') {
    lfo.connect(leadSynth.volume);
  } else {
    lfo.connect(filter.frequency);
  }
  lfo.start();

  // ── Counter synth ─────────────────────────────────────────────────────────
  const counterSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.2, sustain: 0.5, release: 0.6 },
  });
  counterSynth.volume.value = -16;
  counterSynth.connect(dist ?? filter);
  activeNodes.push(counterSynth);

  // ── Bass synth ────────────────────────────────────────────────────────────
  const bassSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.8, release: 0.3 },
  });
  bassSynth.volume.value = -12;
  bassSynth.connect(dist ?? filter);
  activeNodes.push(bassSynth);

  // ── Chord synth ───────────────────────────────────────────────────────────
  const chordSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.15, decay: 0.5, sustain: 0.5, release: 1.2 },
  });
  chordSynth.volume.value = -10;
  chordSynth.connect(dist ?? filter);
  activeNodes.push(chordSynth);

  // ── Drum synth (kick, snare, toms, clap, rimshot) ─────────────────────────
  const drumSynth = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
  }).connect(reverb);
  drumSynth.volume.value = -10;
  activeNodes.push(drumSynth);

  // ── Metal synth (hihat, openhat, crash, ride) ─────────────────────────────
  const metalSynth = new Tone.MetalSynth({
    frequency: 400,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).connect(reverb);
  metalSynth.volume.value = -18;
  activeNodes.push(metalSynth);

  // Step 2: Schedule all notes using `+` prefix for relative transport time ──

  // ── Schedule lead notes ───────────────────────────────────────────────────
  const leadNotes = lead?.notes ?? [];
  for (const note of leadNotes) {
    const freq     = Tone.Frequency(note.pitch, 'midi').toFrequency();
    const duration = (note.endTime - note.startTime) * timeScale;
    Tone.Transport.schedule(time => {
      leadSynth.triggerAttackRelease(freq, duration, time);
      const delayMs = Math.max(0, (time - Tone.now()) * 1000);
      setTimeout(() => {
        if (onNoteOn) onNoteOn(note.pitch);
        setTimeout(() => { if (onNoteOff) onNoteOff(note.pitch); }, duration * 1000);
      }, delayMs);
    }, `+${note.startTime * timeScale}`);
  }

  // ── Schedule counter notes ────────────────────────────────────────────────
  for (const note of (counter?.notes ?? [])) {
    const freq     = Tone.Frequency(note.pitch, 'midi').toFrequency();
    const duration = (note.endTime - note.startTime) * timeScale;
    Tone.Transport.schedule(time => {
      counterSynth.triggerAttackRelease(freq, duration, time);
    }, `+${note.startTime * timeScale}`);
  }

  // ── Schedule bass notes ───────────────────────────────────────────────────
  for (const note of (bass?.notes ?? [])) {
    const freq     = Tone.Frequency(note.pitch, 'midi').toFrequency();
    const duration = (note.endTime - note.startTime) * timeScale;
    Tone.Transport.schedule(time => {
      bassSynth.triggerAttackRelease(freq, duration, time);
    }, `+${note.startTime * timeScale}`);
  }

  // ── Schedule chord notes ──────────────────────────────────────────────────
  for (const note of (chords?.notes ?? [])) {
    const freq     = Tone.Frequency(note.pitch, 'midi').toFrequency();
    const duration = (note.endTime - note.startTime) * timeScale;
    Tone.Transport.schedule(time => {
      chordSynth.triggerAttackRelease(freq, duration, time);
    }, `+${note.startTime * timeScale}`);
  }

  // ── Schedule drum notes ───────────────────────────────────────────────────
  (drums?.notes ?? []).forEach(note => {
    Tone.Transport.schedule((t) => {
      try {
        if ([36, 38, 39, 37, 50, 45].includes(note.pitch)) {
          const freqMap = { 36: 'C1', 38: 'G1', 39: 'D1', 37: 'A1', 50: 'G2', 45: 'D2' };
          drumSynth.triggerAttackRelease(freqMap[note.pitch] ?? 'C1', '16n', t);
        } else {
          const durMap = { 42: '32n', 46: '8n', 49: '2n', 51: '16n' };
          metalSynth.triggerAttackRelease(durMap[note.pitch] ?? '32n', t);
        }
      } catch (e) {}
    }, `+${note.startTime * timeScale}`);
  });

  // ── Detect last note end for onComplete ───────────────────────────────────
  const allEnds = [
    ...leadNotes.map(n => n.endTime),
    ...(counter?.notes ?? []).map(n => n.endTime),
    ...(bass?.notes    ?? []).map(n => n.endTime),
    ...(chords?.notes  ?? []).map(n => n.endTime),
    ...(drums?.notes   ?? []).map(n => n.endTime),
  ];
  const lastEnd = allEnds.length > 0 ? Math.max(...allEnds) : 4;

  Tone.Transport.schedule(() => {
    if (onComplete) onComplete();
  }, `+${(lastEnd + 0.1) * timeScale}`);

  // Step 3: Start transport after all notes are scheduled
  Tone.Transport.start();
}

// ─── Stop and dispose everything ─────────────────────────────────────────────

export function stopPlayback() {
  Tone.Transport.stop();
  Tone.Transport.cancel();
  activeNodes.forEach(node => { try { node.dispose(); } catch (_) {} });
  activeNodes = [];
}

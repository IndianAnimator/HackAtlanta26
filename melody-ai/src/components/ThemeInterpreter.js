// ─── ThemeInterpreter.js ─────────────────────────────────────────────────────
// Pure JS module. No external API calls — all keyword matching.

export function interpretTheme(themeText) {
  const t = (themeText ?? '').toLowerCase();

  // ── MOOD + BPM + DRUM STYLE (single-pass, priority order) ───────────────────
  let mood, bpm, drumStyle;

  if (['chocolate', 'commercial', 'jingle', 'cute', 'kids', 'candy', 'happy',
       'fun', 'bright', 'playful', 'sweet', 'baby', 'bouncy', 'beach', 'summer',
       'tropical', 'ocean', 'wave', 'sun', 'vacation', 'party', 'dance',
       'festival', 'joyful'].some(kw => t.includes(kw))) {
    mood      = 'happy';
    bpm       = 108;
    drumStyle = 'four_on_floor';

  } else if (['coffee', 'lofi', 'lo-fi', 'chill', 'afternoon', 'study', 'rain',
              'cool', 'lazy', 'relaxed', 'mellow', 'cozy', 'warm'].some(kw => t.includes(kw))) {
    mood      = 'lofi';
    bpm       = 82;
    drumStyle = 'lofi_beat';

  } else if (['epic', 'battle', 'boss', 'action', 'war', 'hero', 'power',
              'intense', 'fight', 'chase', 'dramatic', 'thunder'].some(kw => t.includes(kw))) {
    mood      = 'epic';
    bpm       = 145;
    drumStyle = 'driving';

  } else if (['sad', 'heartbreak', 'lonely', 'grief', 'slow', 'cry', 'melancholy',
              'tears', 'quiet', 'soft'].some(kw => t.includes(kw))) {
    mood      = 'sad';
    bpm       = 68;
    drumStyle = 'soft_brush';

  } else if (['jazz', 'swing', 'night', 'cocktail', 'club', 'blues', 'lounge',
              'saxophone', 'trumpet', 'bebop'].some(kw => t.includes(kw))) {
    mood      = 'jazz';
    bpm       = 112;
    drumStyle = 'jazz_brush';

  } else if (['romantic', 'love', 'wedding', 'tender', 'kiss', 'rose',
              'waltz', 'couple'].some(kw => t.includes(kw))) {
    mood      = 'romantic';
    bpm       = 84;
    drumStyle = 'soft_brush';

  } else if (['mystery', 'horror', 'dark', 'ghost', 'eerie', 'space', 'alien',
              'haunted', 'shadow', 'fog', 'galaxy', 'cosmos', 'sci-fi', 'future',
              'robot', 'digital', 'cyber', 'matrix', 'unknown'].some(kw => t.includes(kw))) {
    mood      = 'mysterious';
    bpm       = 78;
    drumStyle = 'sparse_ambient';

  } else if (['classical', 'orchestra', 'symphony', 'elegant', 'grand', 'piano',
              'baroque', 'concert', 'noble'].some(kw => t.includes(kw))) {
    mood      = 'classical';
    bpm       = 96;
    drumStyle = 'soft_brush';

  } else {
    mood      = 'happy';
    bpm       = 110;
    drumStyle = 'four_on_floor';
  }

  // ── TEXTURE / LAYERS ──────────────────────────────────────────────────────────
  let layers;
  if (['big', 'epic', 'orchestra', 'full', 'grand', 'cinematic', 'dramatic', 'powerful']
      .some(kw => t.includes(kw))) {
    layers = 'full';
  } else if (['minimal', 'simple', 'soft', 'gentle', 'quiet', 'solo', 'clean', 'bare']
             .some(kw => t.includes(kw))) {
    layers = 'minimal';
  } else {
    layers = 'standard';
  }

  // ── ACCENT COLOR ──────────────────────────────────────────────────────────────
  let accentColor = '#7c3aed'; // default purple
  if (['chocolate', 'warm', 'cozy', 'coffee', 'wood'].some(kw => t.includes(kw))) {
    accentColor = '#c2410c';
  } else if (['space', 'galaxy', 'cyber', 'future', 'digital'].some(kw => t.includes(kw))) {
    accentColor = '#06b6d4';
  } else if (['romantic', 'love', 'rose', 'wedding'].some(kw => t.includes(kw))) {
    accentColor = '#ec4899';
  } else if (['epic', 'battle', 'power', 'hero'].some(kw => t.includes(kw))) {
    accentColor = '#dc2626';
  } else if (['mystery', 'horror', 'dark', 'ghost'].some(kw => t.includes(kw))) {
    accentColor = '#7c3aed';
  } else if (['nature', 'forest', 'ocean', 'beach'].some(kw => t.includes(kw))) {
    accentColor = '#16a34a';
  }

  // ── DESCRIPTION ───────────────────────────────────────────────────────────────
  const moodScaleNames = {
    happy:      'Warm major scale',
    sad:        'Natural minor scale',
    jazz:       'Bebop scale',
    classical:  'Elegant major scale',
    lofi:       'Minor pentatonic',
    epic:       'Harmonic minor',
    romantic:   'Expressive major scale',
    mysterious: 'Byzantine scale',
  };
  const drumStyleNames = {
    four_on_floor:  'four-on-the-floor beat',
    driving:        'driving double-time drums',
    jazz_brush:     'jazz brush groove',
    lofi_beat:      'lazy lo-fi groove',
    soft_brush:     'soft brush rhythm',
    sparse_ambient: 'sparse ambient percussion',
  };
  const tempoFeel  = bpm >= 130 ? 'energetic' : bpm >= 90 ? 'moderate' : 'relaxed';
  const description =
    `${moodScaleNames[mood]} at ${bpm} BPM — ${tempoFeel} ${drumStyleNames[drumStyle]}`;

  const profile = { mood, bpm, layers, drumStyle, accentColor, description, rawTheme: themeText };
  console.log('[ThemeInterpreter]', { rawTheme: themeText, mood, bpm, drumStyle, description });
  return profile;
}

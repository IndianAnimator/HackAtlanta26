import { useState, useRef } from 'react';
import { generateMelody } from './components/MelodyGenerator';
import { playMelody, stopPlayback } from './components/Playback';
import { generateSynthPatch } from './components/SoundDesigner';
import { interpretTheme } from './components/ThemeInterpreter';
import Controls from './components/Controls';
import PianoRoll from './components/PianoRoll';
import styles from './styles/App.module.css';

export default function App() {
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [isPlaying,      setIsPlaying]      = useState(false);

  // Theme / mood state
  const [theme,          setThemeRaw]       = useState('');
  const [themeProfile,   setThemeProfile]   = useState(null);
  const [moodOverride,   setMoodOverride]   = useState('auto');
  const [tempo,          setTempo]          = useState(110);

  // Generated music state
  const [lead,           setLead]           = useState(null);
  const [counter,        setCounter]        = useState(null);
  const [bass,           setBass]           = useState(null);
  const [chords,         setChords]         = useState(null);
  const [drums,          setDrums]          = useState(null);
  const [activeNote,     setActiveNote]     = useState(null);
  const [synthPatch,     setSynthPatch]     = useState(null);

  const debounceRef = useRef(null);

  // ── Theme change — debounce interpretation ───────────────────────────────
  function handleThemeChange(newTheme) {
    setThemeRaw(newTheme);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (newTheme.trim().length > 2) {
        const profile = interpretTheme(newTheme);
        setThemeProfile(profile);
        if (moodOverride === 'auto') {
          setTempo(profile.bpm);
        }
      } else {
        setThemeProfile(null);
      }
    }, 300);
  }

  // ── Generate ─────────────────────────────────────────────────────────────
  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const activeMood      = moodOverride !== 'auto' ? moodOverride : (themeProfile?.mood ?? 'happy');
      const activeDrumStyle = themeProfile?.drumStyle ?? 'four_on_floor';
      const activeLayers    = themeProfile?.layers    ?? 'standard';

      const patch = generateSynthPatch(activeMood);
      setSynthPatch(patch);

      const result = await generateMelody({
        mood:      activeMood,
        drumStyle: activeDrumStyle,
        layers:    activeLayers,
        tempo,
      });

      setLead(result.lead);
      setCounter(result.counter);
      setBass(result.bass);
      setChords(result.chords);
      setDrums(result.drums);
    } catch (err) {
      console.error('handleGenerate error:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Play ─────────────────────────────────────────────────────────────────
  async function handlePlay() {
    setIsPlaying(true);
    setActiveNote(null);
    await playMelody({
      lead,
      counter,
      bass,
      chords,
      drums,
      tempo,
      synthPatch,
      onNoteOn:   pitch => setActiveNote(pitch),
      onNoteOff:  ()    => setActiveNote(null),
      onComplete: ()    => setIsPlaying(false),
    });
  }

  // ── Stop ─────────────────────────────────────────────────────────────────
  function handleStop() {
    stopPlayback();
    setIsPlaying(false);
    setActiveNote(null);
  }

  const hasMelody = lead !== null;

  return (
    <div className={styles.app}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.badge}>Generative AI · Markov Chain</div>
        <h1 className={styles.title}>🎵 AI Melody Generator</h1>
        <p className={styles.subtitle}>
          Describe a theme and let AI compose music for your scene
        </p>
      </header>

      {/* ── Theme card ─────────────────────────────────────────────────────── */}
      {themeProfile && (
        <div
          className={styles.themeCard}
          style={{ borderLeftColor: themeProfile.accentColor }}
        >
          <div className={styles.themeCardName}>"{themeProfile.rawTheme}"</div>
          <div className={styles.themeCardDesc}>{themeProfile.description}</div>
          <div className={styles.themeCardBadges}>
            <span className={styles.themeBadge}>{themeProfile.mood}</span>
            <span className={styles.themeBadge}>{themeProfile.drumStyle.replace(/_/g, ' ')}</span>
            <span className={styles.themeBadge}>{themeProfile.layers}</span>
          </div>
        </div>
      )}

      <main className={styles.main}>

        {/* ── Controls ──────────────────────────────────────────────────────── */}
        <Controls
          theme={theme}
          setTheme={handleThemeChange}
          themeProfile={themeProfile}
          moodOverride={moodOverride}
          setMoodOverride={setMoodOverride}
          tempo={tempo}
          setTempo={setTempo}
          onGenerate={handleGenerate}
          onPlay={handlePlay}
          onStop={handleStop}
          isLoading={false}
          isGenerating={isGenerating}
          isPlaying={isPlaying}
          hasMelody={hasMelody}
        />

        {/* ── Sound design card ─────────────────────────────────────────────── */}
        {synthPatch && (
          <div className={styles.soundCard}>
            <div className={styles.soundCardHeader}>
              <span className={styles.soundCardIcon}>🎛</span>
              <span className={styles.soundCardTitle}>Sound Design</span>
              <span className={styles.soundCardCharacter}>{synthPatch.character}</span>
            </div>
            <div className={styles.soundCardGrid}>
              <div className={styles.soundCardItem}>
                <span className={styles.soundCardLabel}>Waveform</span>
                <span className={styles.soundCardValue}>{synthPatch.oscillator.waveform}</span>
              </div>
              <div className={styles.soundCardItem}>
                <span className={styles.soundCardLabel}>Filter</span>
                <span className={styles.soundCardValue}>{synthPatch.filter.type}</span>
              </div>
              <div className={styles.soundCardItem}>
                <span className={styles.soundCardLabel}>Reverb</span>
                <span className={styles.soundCardValue}>{Math.round(synthPatch.effects.reverb * 100)}%</span>
              </div>
            </div>
            <div className={styles.macroRow}>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>Brightness</span>
                <div className={styles.macroTrack}>
                  <div className={styles.macroFill} style={{ width: `${Math.round(synthPatch.macros.brightness * 100)}%` }} />
                </div>
                <span className={styles.macroVal}>{Math.round(synthPatch.macros.brightness * 100)}%</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>Movement</span>
                <div className={styles.macroTrack}>
                  <div className={styles.macroFill} style={{ width: `${Math.round(Math.min(synthPatch.macros.movement, 1) * 100)}%` }} />
                </div>
                <span className={styles.macroVal}>{Math.round(Math.min(synthPatch.macros.movement, 1) * 100)}%</span>
              </div>
              <div className={styles.macroItem}>
                <span className={styles.macroLabel}>Space</span>
                <div className={styles.macroTrack}>
                  <div className={styles.macroFill} style={{ width: `${Math.round(synthPatch.macros.space * 100)}%` }} />
                </div>
                <span className={styles.macroVal}>{Math.round(synthPatch.macros.space * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Piano roll ────────────────────────────────────────────────────── */}
        <PianoRoll
          lead={lead}
          counter={counter}
          bass={bass}
          chords={chords}
          drums={drums}
          activeNote={activeNote}
          isPlaying={isPlaying}
          width={900}
          height={380}
        />

      </main>

      <footer className={styles.footer}>
        Built with Markov Chains + Tone.js
      </footer>
    </div>
  );
}

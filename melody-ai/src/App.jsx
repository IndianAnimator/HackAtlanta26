import { useState, useRef, useEffect } from 'react';
import { generateMelody } from './components/MelodyGenerator';
import { interpretTheme } from './components/ThemeInterpreter';
import { buildStrudelScore, playStrudelScore, stopStrudelPlayback } from './components/StrudelEngine';
import { createMidiFile } from './components/MidiExporter';
import Controls from './components/Controls';
import PianoRoll from './components/PianoRoll';
import styles from './styles/App.module.css';

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [theme, setThemeRaw] = useState('');
  const [themeProfile, setThemeProfile] = useState(null);
  const [moodOverride, setMoodOverride] = useState('happy');
  const [tempo, setTempo] = useState(110);

  const [lead, setLead] = useState(null);
  const [counter, setCounter] = useState(null);
  const [bass, setBass] = useState(null);
  const [chords, setChords] = useState(null);
  const [drums, setDrums] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [synthPatch, setSynthPatch] = useState(null);
  const [generationSource, setGenerationSource] = useState(null);
  const [strudelScore, setStrudelScore] = useState(null);
  const [isExportingMidi, setIsExportingMidi] = useState(false);
  const [isExportingDrumMidi, setIsExportingDrumMidi] = useState(false);

  const debounceRef = useRef(null);
  const visualTimersRef = useRef([]);

  useEffect(() => {
    return () => {
      clearVisualTimers();
      stopStrudelPlayback();
    };
  }, []);

  function clearVisualTimers() {
    visualTimersRef.current.forEach(clearTimeout);
    visualTimersRef.current = [];
  }

  function scheduleVisualPlayback(layer) {
    clearVisualTimers();
    if (!layer?.notes?.length) return;
    const scale = 120 / (tempo || 120);
    layer.notes.forEach((note) => {
      const startMs = note.startTime * scale * 1000;
      const durationMs = (note.endTime - note.startTime) * scale * 1000;
      const onId = setTimeout(() => setActiveNote(note.pitch), startMs);
      const offId = setTimeout(() => setActiveNote(null), startMs + durationMs);
      visualTimersRef.current.push(onId, offId);
    });
    const totalMs = (layer.totalTime ?? 16) * scale * 1000 + 120;
    const doneId = setTimeout(() => {
      stopStrudelPlayback();
      setIsPlaying(false);
      setActiveNote(null);
    }, totalMs);
    visualTimersRef.current.push(doneId);
  }

  function handleThemeChange(newTheme) {
    setThemeRaw(newTheme);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (newTheme.trim().length > 2) {
        const profile = interpretTheme(newTheme);
        setThemeProfile(profile);
      } else {
        setThemeProfile(null);
      }
    }, 300);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const activeMood = moodOverride || themeProfile?.mood || 'happy';
      const activeDrumStyle = themeProfile?.drumStyle ?? 'four_on_floor';
      const activeLayers = themeProfile?.layers ?? 'standard';

      const result = await generateMelody({
        mood: activeMood,
        drumStyle: activeDrumStyle,
        layers: activeLayers,
        theme,
        tempo,
      });

      setLead(result.lead);
      setCounter(result.counter);
      setBass(result.bass);
      setChords(result.chords);
      setDrums(result.drums);

      try {
        const strudel = buildStrudelScore({ mood: activeMood, theme });
        setStrudelScore(strudel);
        setSynthPatch(strudel.patch);
        setGenerationSource('strudel');
      } catch (err) {
        console.error('Strudel builder error:', err);
        setStrudelScore(null);
        setSynthPatch(null);
        setGenerationSource(result.source);
      }
    } catch (err) {
      console.error('handleGenerate error:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePlay() {
    if (!lead || !strudelScore?.arrangement) return;
    setIsPlaying(true);
    setActiveNote(null);
    try {
      await playStrudelScore(strudelScore.arrangement, tempo);
      scheduleVisualPlayback(lead);
    } catch (err) {
      console.error('playStrudelScore error:', err);
      setIsPlaying(false);
      clearVisualTimers();
      stopStrudelPlayback();
    }
  }

  function handleStop() {
    clearVisualTimers();
    stopStrudelPlayback();
    setIsPlaying(false);
    setActiveNote(null);
  }

  function triggerDownload(buffer, filename) {
    const blob = new Blob([buffer], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function handleDownloadMidi() {
    if (!hasMelody || isExportingMidi) return;
    setIsExportingMidi(true);
    try {
      const { buffer, filename } = createMidiFile({
        lead,
        counter,
        bass,
        chords,
        drums,
        tempo,
        mood: moodOverride || themeProfile?.mood || 'happy',
        theme: theme || themeProfile?.rawTheme || 'melody-ai',
      });
      triggerDownload(buffer, filename);
    } catch (err) {
      console.error('handleDownloadMidi error:', err);
    } finally {
      setIsExportingMidi(false);
    }
  }

  async function handleDownloadDrumMidi() {
    if (!hasDrumTrack || isExportingDrumMidi) return;
    setIsExportingDrumMidi(true);
    try {
      const { buffer, filename } = createMidiFile({
        lead,
        counter,
        bass,
        chords,
        drums,
        tempo,
        mood: moodOverride || themeProfile?.mood || 'happy',
        theme: theme || themeProfile?.rawTheme || 'melody-ai',
        layersToInclude: ['drums'],
        filenameSuffix: 'drums',
      });
      triggerDownload(buffer, filename);
    } catch (err) {
      console.error('handleDownloadDrumMidi error:', err);
    } finally {
      setIsExportingDrumMidi(false);
    }
  }

  const hasMelody = Boolean(lead && strudelScore?.arrangement);
  const hasDrumTrack = Boolean(drums?.notes?.length);

  const sourceStyles = (() => {
    if (generationSource === 'strudel') {
      return {
        text: '🎚️ Arranged with Strudel',
        bg: 'rgba(14,165,233,0.15)',
        color: '#0ea5e9',
        border: 'rgba(14,165,233,0.4)',
      };
    }
    if (generationSource === 'claude') {
      return {
        text: '🤖 Composed by Claude AI',
        bg: 'rgba(34,197,94,0.12)',
        color: '#22c55e',
        border: 'rgba(34,197,94,0.3)',
      };
    }
    if (generationSource === 'algorithmic') {
      return {
        text: '⚙️ Algorithmic fallback — Claude unavailable',
        bg: 'rgba(251,191,36,0.12)',
        color: '#f59e0b',
        border: 'rgba(251,191,36,0.3)',
      };
    }
    return null;
  })();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.badge}>Generative Audio · Strudel.cc</div>
        <h1 className={styles.title}>🎵 AI Melody Generator</h1>
        <p className={styles.subtitle}>
          Describe a theme and let AI compose music for your scene
        </p>
      </header>

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
          hasDrumTrack={hasDrumTrack}
          onDownloadMidi={handleDownloadMidi}
          onDownloadDrumMidi={handleDownloadDrumMidi}
          isExportingMidi={isExportingMidi}
          isExportingDrumMidi={isExportingDrumMidi}
        />

        {synthPatch && (
          <div className={styles.soundCard}>
            <div className={styles.soundCardHeader}>
              <span className={styles.soundCardIcon}>🎛️</span>
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

        {sourceStyles && (
          <div
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '12px',
              background: sourceStyles.bg,
              color: sourceStyles.color,
              border: `1px solid ${sourceStyles.border}`,
            }}
          >
            {sourceStyles.text}
          </div>
        )}

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
        Built with Strudel + Tone.js visuals
      </footer>
    </div>
  );
}

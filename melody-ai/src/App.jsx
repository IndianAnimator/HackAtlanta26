import { useState, useEffect } from 'react';
import { initModel, generateMelody } from './components/MelodyGenerator';
import { playMelody, stopPlayback } from './components/Playback';
import Controls from './components/Controls';
import PianoRoll from './components/PianoRoll';
import styles from './styles/App.module.css';

const NOTE_MAP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseNoteInput(text) {
  if (!text.trim()) return [];
  return text
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map(token => {
      const match = token.match(/^([A-G])(\d)$/);
      if (!match) return null;
      const [, noteName, octave] = match;
      return (parseInt(octave) + 1) * 12 + NOTE_MAP[noteName];
    })
    .filter(n => n !== null)
    .slice(0, 3);
}

export default function App() {
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [noteSequence, setNoteSequence] = useState(null);
  const [mood, setMood] = useState('pop');
  const [seedNotesText, setSeedNotesText] = useState('');
  const [tempo, setTempo] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  useEffect(() => {
    initModel()
      .then(m => {
        setModel(m);
        setIsModelLoading(false);
      })
      .catch(() => setIsModelLoading(false));
  }, []);

  async function handleGenerate() {
    setIsGenerating(true);
    const seedNotes = parseNoteInput(seedNotesText);
    try {
      const seq = await generateMelody({ model, seedNotes, mood, steps: 32 });
      setNoteSequence(seq);
    } finally {
      setIsGenerating(false);
    }
  }

  function handlePlay() {
    if (!noteSequence) return;
    setIsPlaying(true);
    setActiveNote(null);
    playMelody({
      noteSequence,
      tempo,
      onNoteOn: pitch => setActiveNote(pitch),
      onNoteOff: () => setActiveNote(null),
      onComplete: () => setIsPlaying(false),
    });
  }

  function handleStop() {
    stopPlayback();
    setIsPlaying(false);
    setActiveNote(null);
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.badge}>Generative AI · MelodyRNN</div>
        <h1 className={styles.title}>🎵 AI Melody Generator</h1>
        <p className={styles.subtitle}>
          Compose unique melodies with neural networks, right in your browser
        </p>
      </header>

      {isModelLoading && (
        <div className={styles.loadingBanner}>
          <div className={styles.loadingDots}>
            <span />
            <span />
            <span />
          </div>
          <span>Loading AI model...</span>
        </div>
      )}

      <main className={styles.main}>
        <Controls
          mood={mood}
          setMood={setMood}
          seedNotesText={seedNotesText}
          setSeedNotesText={setSeedNotesText}
          tempo={tempo}
          setTempo={setTempo}
          onGenerate={handleGenerate}
          onPlay={handlePlay}
          onStop={handleStop}
          isLoading={isModelLoading || isGenerating}
          isPlaying={isPlaying}
          hasMelody={!!noteSequence}
        />

        <PianoRoll
          noteSequence={noteSequence}
          activeNote={activeNote}
          width={800}
          height={300}
          isPlaying={isPlaying}
          tempo={tempo}
        />
      </main>

      <footer className={styles.footer}>
        Built at HackAtlanta 2026
      </footer>
    </div>
  );
}

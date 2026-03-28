import styles from '../styles/Controls.module.css';

const MOOD_OPTIONS = [
  { value: 'pop', label: 'Pop' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'classical', label: 'Classical' },
  { value: 'lo-fi', label: 'Lo-Fi' },
  { value: 'random', label: 'Random' },
];

export default function Controls({
  mood, setMood,
  seedNotesText, setSeedNotesText,
  tempo, setTempo,
  onGenerate, onPlay, onStop,
  isLoading, isPlaying, hasMelody,
}) {
  return (
    <div className={styles.controls}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="mood-select">
            Mood / Genre
          </label>
          <select
            id="mood-select"
            className={styles.select}
            value={mood}
            onChange={e => setMood(e.target.value)}
            disabled={isLoading}
          >
            {MOOD_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="seed-input">
            Seed Notes
            <span className={styles.helper}>Optional: enter 1–3 notes</span>
          </label>
          <input
            id="seed-input"
            className={styles.input}
            type="text"
            placeholder="e.g. C4 E4 G4"
            value={seedNotesText}
            onChange={e => setSeedNotesText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="tempo-slider">
            Tempo
            <span className={styles.bpmDisplay}>{tempo} BPM</span>
          </label>
          <input
            id="tempo-slider"
            className={styles.slider}
            type="range"
            min={60}
            max={180}
            value={tempo}
            onChange={e => setTempo(Number(e.target.value))}
            disabled={isLoading || isPlaying}
          />
        </div>
      </div>

      <div className={styles.buttons}>
        <button
          className={styles.generateBtn}
          onClick={onGenerate}
          disabled={isLoading || isPlaying}
        >
          {isLoading ? (
            <span className={styles.loadingText}>
              <span className={styles.spinner} />
              Generating...
            </span>
          ) : '✨ Generate Melody'}
        </button>

        {hasMelody && !isLoading && (
          isPlaying ? (
            <button className={styles.stopBtn} onClick={onStop}>
              ⏹ Stop
            </button>
          ) : (
            <button className={styles.playBtn} onClick={onPlay}>
              ▶ Play
            </button>
          )
        )}
      </div>
    </div>
  );
}

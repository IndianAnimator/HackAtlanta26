import React from 'react'
import { DEFAULT_TEMPOS } from './MelodyGenerator'
import styles from '../styles/Controls.module.css'

export default function Controls({
  theme, setTheme, themeProfile,
  moodOverride, setMoodOverride,
  tempo, setTempo,
  onGenerate, onPlay, onStop,
  onDownloadMidi, onDownloadDrumMidi,
  isLoading, isGenerating, isPlaying,
  hasMelody, hasDrumTrack,
  isExportingMidi, isExportingDrumMidi,
}) {

  function handleThemeChange(e) {
    const val = e.target.value
    setTheme(val)
  }

  return (
    <div className={styles.container}>

      {/* THEME INPUT — primary control */}
      <div className={styles.themeGroup}>
        <label className={styles.label}>🎨 Describe your vibe</label>
        <input
          type="text"
          className={styles.themeInput}
          value={theme}
          onChange={handleThemeChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !isLoading && !isGenerating && !isPlaying) onGenerate()
          }}
          placeholder='e.g. "chocolate commercial", "boss battle", "rainy coffee shop"'
          disabled={isLoading || isGenerating || isPlaying}
          autoComplete="off"
        />
        <p className={styles.themeDescription}>
          {themeProfile
            ? `→ ${themeProfile.description}`
            : 'Type a theme above to get started'}
        </p>
      </div>

      {/* MOOD OVERRIDE */}
      <div className={styles.controlGroup}>
        <label className={styles.label}>Mood</label>
        <select
          className={styles.select}
          value={moodOverride}
          onChange={e => {
            const value = e.target.value
            setMoodOverride(value)
            if (DEFAULT_TEMPOS[value]) {
              setTempo(DEFAULT_TEMPOS[value])
            }
          }}
          disabled={isLoading || isGenerating}
        >
          <option value="happy">Happy</option>
          <option value="sad">Sad</option>
          <option value="jazz">Jazz</option>
          <option value="classical">Classical</option>
          <option value="lofi">Lo-Fi</option>
          <option value="epic">Epic</option>
          <option value="romantic">Romantic</option>
          <option value="mysterious">Mysterious</option>
        </select>
      </div>

      {/* TEMPO */}
      <div className={styles.controlGroup}>
        <label className={styles.label}>Tempo</label>
        <input
          type="range"
          min={60} max={180}
          value={tempo}
          onChange={e => setTempo(Number(e.target.value))}
          className={styles.slider}
          disabled={isLoading || isGenerating || isPlaying}
        />
        <span className={styles.bpmLabel}>{tempo} BPM</span>
      </div>

      {/* BUTTONS */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.generateButton}
          onClick={onGenerate}
          disabled={isLoading || isGenerating || isPlaying}
        >
          {isGenerating ? 'Generating...' : '✨ Generate'}
        </button>

        <button
          className={styles.playButton}
          onClick={isPlaying ? onStop : onPlay}
          disabled={!hasMelody || isGenerating}
        >
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>

        <button
          className={styles.downloadButton}
          onClick={onDownloadMidi}
          disabled={!hasMelody || isGenerating || isExportingMidi}
        >
          {isExportingMidi ? 'Preparing MIDI...' : '⬇️ Download MIDI'}
        </button>

        <button
          className={styles.downloadButton}
          onClick={onDownloadDrumMidi}
          disabled={!hasDrumTrack || isGenerating || isExportingDrumMidi}
        >
          {isExportingDrumMidi ? 'Preparing Drums...' : '🥁 Drum MIDI'}
        </button>
      </div>

    </div>
  )
}

import { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import styles from '../styles/PianoRoll.module.css';

const MIN_PITCH = 48; // C3
const MAX_PITCH = 84; // C6
const PITCH_RANGE = MAX_PITCH - MIN_PITCH + 1; // 37

// semitone offsets within an octave that are black keys
const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);

const NOTE_COLORS = [
  '#ef4444', // C  - red
  '#f87171', // C# - light red
  '#f97316', // D  - orange
  '#fb923c', // D# - light orange
  '#eab308', // E  - yellow
  '#22c55e', // F  - green
  '#4ade80', // F# - light green
  '#06b6d4', // G  - cyan
  '#22d3ee', // G# - light cyan
  '#3b82f6', // A  - blue
  '#818cf8', // A# - indigo
  '#a855f7', // B  - purple
];

export default function PianoRoll({ noteSequence, activeNote, width, height, isPlaying, tempo }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const laneH = H / PITCH_RANGE;

      // Background
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      // Draw pitch lanes
      for (let p = MIN_PITCH; p <= MAX_PITCH; p++) {
        const pitchClass = p % 12;
        const isBlack = BLACK_KEY_OFFSETS.has(pitchClass);
        const y = H - (p - MIN_PITCH + 1) * laneH;

        ctx.fillStyle = isBlack ? '#13132a' : '#1e1e3f';
        ctx.fillRect(0, y, W, laneH);

        // Highlight C notes with a subtle brighter stripe
        if (pitchClass === 0) {
          ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
          ctx.fillRect(0, y, W, laneH);
        }

        // Lane separator
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, y + laneH - 1, W, 1);
      }

      // Draw notes
      if (noteSequence?.notes?.length) {
        const totalTime = noteSequence.totalTime || 4;

        noteSequence.notes.forEach(note => {
          if (note.pitch < MIN_PITCH || note.pitch > MAX_PITCH) return;

          const pitchClass = note.pitch % 12;
          const color = NOTE_COLORS[pitchClass];
          const isActive = note.pitch === activeNote;

          const x = (note.startTime / totalTime) * W;
          const noteW = Math.max(3, ((note.endTime - note.startTime) / totalTime) * W - 2);
          const y = H - (note.pitch - MIN_PITCH + 1) * laneH + 1;
          const noteH = laneH - 2;

          // Glow shadow
          ctx.shadowColor = isActive ? '#ffffff' : color;
          ctx.shadowBlur = isActive ? 14 : 5;

          // Note fill
          ctx.fillStyle = isActive ? '#ffffff' : color;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, noteW, noteH, 2);
          } else {
            ctx.rect(x, y, noteW, noteH);
          }
          ctx.fill();
          ctx.shadowBlur = 0;

          // Active outline ring
          if (isActive) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x - 1, y - 1, noteW + 2, noteH + 2, 3);
            } else {
              ctx.rect(x - 1, y - 1, noteW + 2, noteH + 2);
            }
            ctx.stroke();
          }
        });
      }

      // Playhead
      if (isPlaying) {
        const timeScale = 120 / (tempo || 120);
        const totalTime = (noteSequence?.totalTime || 4) * timeScale;
        const transportSec = Tone.getTransport().seconds;
        const playheadX = Math.min((transportSec / totalTime) * W, W);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, H);
        ctx.stroke();
        ctx.restore();
      }
    }

    if (isPlaying) {
      const animate = () => {
        draw();
        rafRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      draw();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [noteSequence, activeNote, isPlaying, tempo]);

  return (
    <div className={styles.container}>
      {noteSequence ? (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={styles.canvas}
        />
      ) : (
        <div className={styles.placeholder} style={{ width, height }}>
          <div className={styles.placeholderInner}>
            <span className={styles.placeholderIcon}>🎹</span>
            <p>Generate a melody to see the piano roll</p>
          </div>
        </div>
      )}
    </div>
  );
}

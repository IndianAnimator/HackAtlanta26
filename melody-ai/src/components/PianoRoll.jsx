import { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import styles from '../styles/PianoRoll.module.css';

const MIN_PITCH   = 33;  // A1
const MAX_PITCH   = 84;  // C6
const PITCH_RANGE = MAX_PITCH - MIN_PITCH + 1;
const DRUM_H      = 60;  // px reserved at bottom for drum lane

const BLACK_PITCHES = new Set([1, 3, 6, 8, 10]);

const PITCH_CLASS_COLORS = {
  0:  '#ef4444',  // C
  2:  '#f97316',  // D
  4:  '#eab308',  // E
  5:  '#22c55e',  // F
  7:  '#06b6d4',  // G
  9:  '#3b82f6',  // A
  11: '#a855f7',  // B
};

// Drum hit colors keyed by MIDI note
const DRUM_COLORS = {
  36: '#ef4444',  // kick       — red
  38: '#f97316',  // snare      — orange
  42: '#06b6d4',  // hihat      — cyan   (half height)
  46: '#38bdf8',  // openhat    — light blue (half height)
  39: '#a855f7',  // clap       — purple
  50: '#84cc16',  // tom_hi     — lime
  45: '#65a30d',  // tom_lo     — dark lime
  49: '#fbbf24',  // crash      — amber  (full height + glow)
  51: '#94a3b8',  // ride       — slate  (half height)
  37: '#e2e8f0',  // rimshot    — white  (half height)
};

const DRUM_HALF_HEIGHT = new Set([42, 46, 51, 37]);
const DRUM_LABELS = {
  36: 'K', 38: 'S', 42: 'HH', 46: 'OH',
  39: 'CL', 50: 'TH', 45: 'TL', 49: 'CR', 51: 'RD', 37: 'RM',
};

function getPitchColor(pitch) {
  return PITCH_CLASS_COLORS[pitch % 12] ?? '#94a3b8';
}

function drawRoundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

function getTotalTime(lead, counter, bass, chords, drums) {
  let max = 0;
  for (const layer of [lead, counter, bass, chords, drums]) {
    if (!layer?.notes) continue;
    for (const n of layer.notes) {
      if ((n.endTime ?? 0) > max) max = n.endTime;
    }
  }
  return max || 4;
}

export default function PianoRoll({ lead, counter, bass, chords, drums, activeNote, isPlaying, width, height }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    const PIANO_W  = 24;
    const ROLL_W   = width - PIANO_W;
    const MELODY_H = height - DRUM_H; // melody notes live in top portion

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx  = canvas.getContext('2d');
      const W    = canvas.width;
      const H    = canvas.height;
      const rowH = MELODY_H / PITCH_RANGE;

      const totalTime       = getTotalTime(lead, counter, bass, chords, drums);
      const pixelsPerSecond = ROLL_W / totalTime;

      // ── Full background ─────────────────────────────────────────────────────
      ctx.fillStyle = '#0d0c1d';
      ctx.fillRect(0, 0, W, H);

      // ── Piano keys (left 24px, melody area only) ───────────────────────────
      for (let p = MIN_PITCH; p <= MAX_PITCH; p++) {
        const pc      = p % 12;
        const isBlack = BLACK_PITCHES.has(pc);
        const y       = MELODY_H - (p - MIN_PITCH + 1) * rowH;

        ctx.fillStyle = isBlack ? '#0f0e2a' : '#1e1b4b';
        ctx.fillRect(0, y, PIANO_W, rowH);

        if (pc === 0) {
          const octave = Math.floor(p / 12) - 1;
          ctx.fillStyle    = 'rgba(255,255,255,0.45)';
          ctx.font         = '9px Inter, sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText(`C${octave}`, 2, y + rowH / 2);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.025)';
        ctx.fillRect(0, y + rowH - 1, PIANO_W, 1);
      }

      // ── Piano roll lane backgrounds ────────────────────────────────────────
      for (let p = MIN_PITCH; p <= MAX_PITCH; p++) {
        const pc      = p % 12;
        const isBlack = BLACK_PITCHES.has(pc);
        const y       = MELODY_H - (p - MIN_PITCH + 1) * rowH;

        ctx.fillStyle = isBlack ? '#12112a' : '#1a1833';
        ctx.fillRect(PIANO_W, y, ROLL_W, rowH);

        if (pc === 0) {
          ctx.fillStyle = 'rgba(124,58,237,0.06)';
          ctx.fillRect(PIANO_W, y, ROLL_W, rowH);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(PIANO_W, y + rowH - 1, ROLL_W, 1);
      }

      // ── Layer 1: Chord blocks ──────────────────────────────────────────────
      if (chords?.notes?.length) {
        ctx.globalAlpha = 0.4;
        for (const note of chords.notes) {
          if (note.pitch < MIN_PITCH || note.pitch > MAX_PITCH) continue;
          const x     = PIANO_W + note.startTime * pixelsPerSecond;
          const noteW = Math.max(3, (note.endTime - note.startTime) * pixelsPerSecond - 1);
          const y     = MELODY_H - (note.pitch - MIN_PITCH + 1) * rowH + 1;
          const noteH = rowH - 2;
          ctx.fillStyle   = '#312e81';
          ctx.shadowColor = '#818cf8';
          ctx.shadowBlur  = 3;
          ctx.beginPath();
          drawRoundRect(ctx, x, y, noteW, noteH, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // ── Layer 2: Bass notes ────────────────────────────────────────────────
      if (bass?.notes?.length) {
        ctx.globalAlpha = 0.85;
        for (const note of bass.notes) {
          if (note.pitch < MIN_PITCH || note.pitch > MAX_PITCH) continue;
          const x     = PIANO_W + note.startTime * pixelsPerSecond;
          const noteW = Math.max(3, (note.endTime - note.startTime) * pixelsPerSecond - 1);
          const y     = MELODY_H - (note.pitch - MIN_PITCH + 1) * rowH + 1;
          const noteH = rowH - 2;
          ctx.fillStyle   = '#1e40af';
          ctx.shadowColor = '#3b82f6';
          ctx.shadowBlur  = 4;
          ctx.beginPath();
          drawRoundRect(ctx, x, y, noteW, noteH, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // ── Layer 3: Counter melody ────────────────────────────────────────────
      if (counter?.notes?.length) {
        ctx.globalAlpha = 0.8;
        for (const note of counter.notes) {
          if (note.pitch < MIN_PITCH || note.pitch > MAX_PITCH) continue;
          const x     = PIANO_W + note.startTime * pixelsPerSecond;
          const noteW = Math.max(3, (note.endTime - note.startTime) * pixelsPerSecond - 1);
          const y     = MELODY_H - (note.pitch - MIN_PITCH + 1) * rowH + 1;
          const noteH = rowH - 2;
          ctx.fillStyle   = '#0f766e';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur  = 4;
          ctx.beginPath();
          drawRoundRect(ctx, x, y, noteW, noteH, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
      }

      // ── Layer 4: Lead melody ───────────────────────────────────────────────
      if (lead?.notes?.length) {
        for (const note of lead.notes) {
          if (note.pitch < MIN_PITCH || note.pitch > MAX_PITCH) continue;
          const isActive = note.pitch === activeNote;
          const color    = getPitchColor(note.pitch);
          const x     = PIANO_W + note.startTime * pixelsPerSecond;
          const noteW = Math.max(3, (note.endTime - note.startTime) * pixelsPerSecond - 1);
          const y     = MELODY_H - (note.pitch - MIN_PITCH + 1) * rowH + 1;
          const noteH = rowH - 2;

          ctx.fillStyle   = isActive ? '#ffffff' : color;
          ctx.shadowColor = isActive ? 'white' : color;
          ctx.shadowBlur  = isActive ? 12 : 5;
          ctx.beginPath();
          drawRoundRect(ctx, x, y, noteW, noteH, 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          if (isActive) {
            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth   = 1.5;
            ctx.beginPath();
            drawRoundRect(ctx, x - 1, y - 1, noteW + 2, noteH + 2, 3);
            ctx.stroke();
          }
        }
      }

      // ── Drum lane separator ────────────────────────────────────────────────
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, MELODY_H, W, 1);

      // ── Drum lane background ───────────────────────────────────────────────
      ctx.fillStyle = '#09091a';
      ctx.fillRect(0, MELODY_H + 1, W, DRUM_H - 1);

      // "DRUMS" label on left edge
      ctx.fillStyle    = '#334155';
      ctx.font         = '8px Inter, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('DRUMS', 3, MELODY_H + DRUM_H / 2);

      // ── Drum hits ─────────────────────────────────────────────────────────
      if (drums?.notes?.length) {
        const laneTop  = MELODY_H + 2;
        const laneH    = DRUM_H - 4;
        const halfH    = Math.floor(laneH / 2);

        for (const note of drums.notes) {
          const color = DRUM_COLORS[note.pitch];
          if (!color) continue;

          const x       = PIANO_W + note.startTime * pixelsPerSecond;
          if (x < PIANO_W || x > W) continue;

          const isCrash   = note.pitch === 49;
          const isHalf    = DRUM_HALF_HEIGHT.has(note.pitch);
          const barH      = isCrash ? laneH : isHalf ? halfH : laneH;
          const barY      = isCrash ? laneTop : isHalf ? laneTop : laneTop;

          ctx.fillStyle = color;
          if (isCrash) {
            ctx.shadowColor = color;
            ctx.shadowBlur  = 6;
          }
          ctx.fillRect(x, barY, 4, barH);
          ctx.shadowBlur = 0;
        }
      }

      // ── Playhead (full canvas height including drum lane) ──────────────────
      if (isPlaying) {
        const px = PIANO_W + Tone.getTransport().seconds * pixelsPerSecond;
        if (px >= PIANO_W && px <= W) {
          ctx.save();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth   = 2;
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur  = 8;
          ctx.beginPath();
          ctx.moveTo(px, 0);
          ctx.lineTo(px, H);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Legend (top-right, two rows) ───────────────────────────────────────
      const melodyLegend = [
        { label: 'Lead',    color: '#ef4444' },
        { label: 'Counter', color: '#0f766e' },
        { label: 'Bass',    color: '#1e40af' },
        { label: 'Chords',  color: '#312e81' },
      ];
      const drumLegend = [
        { label: 'Kick',    color: '#ef4444' },
        { label: 'Snare',   color: '#f97316' },
        { label: 'HiHat',   color: '#06b6d4' },
        { label: 'Crash',   color: '#fbbf24' },
      ];

      const boxSize = 8;
      const itemW   = 60;
      const rowGap  = 18;
      const padH    = rowGap * 2 + 8;
      const padW    = melodyLegend.length * itemW + 8;
      const legendX = W - padW - 4;
      const legendY = 6;

      ctx.save();
      ctx.fillStyle = 'rgba(10,10,20,0.78)';
      ctx.beginPath();
      drawRoundRect(ctx, legendX - 4, legendY - 4, padW + 8, padH, 4);
      ctx.fill();

      ctx.font         = '10px Inter, sans-serif';
      ctx.textBaseline = 'middle';

      melodyLegend.forEach((item, i) => {
        const lx = legendX + i * itemW;
        const ly = legendY + 4;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, ly, boxSize, boxSize);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(item.label, lx + boxSize + 3, ly + boxSize / 2);
      });

      drumLegend.forEach((item, i) => {
        const lx = legendX + i * itemW;
        const ly = legendY + 4 + rowGap;
        ctx.fillStyle = item.color;
        ctx.fillRect(lx, ly, boxSize, boxSize);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillText(item.label, lx + boxSize + 3, ly + boxSize / 2);
      });

      ctx.restore();
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
  }, [lead, counter, bass, chords, drums, activeNote, isPlaying, width, height]);

  const hasContent = !!(lead || counter || bass || chords || drums);

  return (
    <div className={styles.container}>
      {hasContent ? (
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

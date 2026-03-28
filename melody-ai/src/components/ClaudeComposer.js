// ─── ClaudeComposer.js ────────────────────────────────────────────────────────

export async function composeWithClaude(theme, mood, tempo) {

  const prompt = `You are a professional music composer AI. Compose a full instrumental loop based on: theme="${theme}", mood=${mood}, tempo=${tempo} BPM.

Return ONLY raw JSON — no markdown, no explanation, no code blocks.

Exact JSON shape:
{
  "key": "C major",
  "totalTime": 24,
  "lead":    [ { "pitch": 64, "startTime": 0.0, "endTime": 0.5, "velocity": 85 } ],
  "counter": [ { "pitch": 60, "startTime": 0.5, "endTime": 1.0, "velocity": 65 } ],
  "bass":    [ { "pitch": 48, "startTime": 0.0, "endTime": 1.0, "velocity": 90 } ],
  "chords":  [
    { "pitch": 60, "startTime": 0.0, "endTime": 2.0, "velocity": 50 },
    { "pitch": 64, "startTime": 0.0, "endTime": 2.0, "velocity": 50 },
    { "pitch": 67, "startTime": 0.0, "endTime": 2.0, "velocity": 50 }
  ]
}

MANDATORY RULES — follow every one precisely:

TIMING (all times in real seconds at ${tempo} BPM):
- totalTime: exactly 24 seconds
- 1 beat = ${(60 / tempo).toFixed(3)} seconds at ${tempo} BPM
- 1 bar (4 beats) = ${(240 / tempo).toFixed(3)} seconds

CHORDS (most important layer — always present):
- Change chord every 2 beats (every ${(120 / tempo).toFixed(3)} seconds)
- That means 16 chord changes across the 24-second loop
- Each chord = 3–4 simultaneous notes stacked at the same startTime
- Use rich progressions: I–V–vi–IV, ii–V–I, I–IV–V–I, vi–IV–I–V, etc.
- Cycle through at least 4 different progressions across the loop
- velocity 45–55 for all chord notes
- Chord pitch range: 48–72 (mid-range, not too high)

LEAD MELODY (topline):
- 30–40 notes total across the full 24 seconds
- Pitch range 60–84
- Multiple phrases: 4 distinct melodic phrases of ~6 seconds each
- Each phrase has its own character (ascending, descending, arching, repeating motif)
- Short note durations: 0.25–1.0 seconds each
- velocity 80–95

COUNTER MELODY:
- 16–24 notes total
- Pitch range 55–76
- Moves in contrary motion to lead (when lead goes up, counter goes down)
- Fills gaps between lead phrases
- velocity 60–75

BASS:
- 1 bass note per chord change = 16 bass notes
- Pitch range 36–52
- Plays root note of each chord on the downbeat
- Duration: slightly less than chord duration
- velocity 85–95

MOOD CHARACTER:
- happy/fun → C major, bouncy 8th notes, lots of stepwise motion upward
- sad/melancholy → A minor, long notes, descending phrases
- epic/intense → D harmonic minor, dramatic leaps, strong downbeats
- jazz → Bb major with 7ths/9ths, syncopation, chromatic runs
- lofi/chill → D minor pentatonic, lazy rhythm, off-beat phrasing
- romantic → G major 7th chords, smooth legato, moderate pace
- mysterious → C diminished/whole-tone, sparse wide leaps
- classical → C major, strict voice leading, clear cadences

QUALITY RULES:
- Every note must be in the key — no accidentals unless jazz
- No note in the same voice overlaps (endTime <= next startTime)
- Lead must end on the root note of the key at totalTime-0.5
- Bass and chords must be harmonically aligned at all times`

  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [{ type: 'text', text: prompt }]
        }]
      })
    })

    const data = await response.json()
    console.log('[ClaudeComposer] HTTP', response.status, JSON.stringify(data).slice(0, 300))

    if (!response.ok) {
      throw new Error(`API error ${response.status}: ${data.error?.message ?? JSON.stringify(data)}`)
    }

    if (!data.content || !data.content[0]) {
      throw new Error('Empty response from Claude API')
    }

    const text = data.content[0].text.trim()

    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Validate required fields exist and have notes
    if (!parsed.lead?.length || !parsed.chords?.length || !parsed.bass?.length) {
      throw new Error('Claude returned incomplete note data')
    }

    console.log('[ClaudeComposer] Success:', {
      key: parsed.key,
      tempo: parsed.tempo,
      leadNotes: parsed.lead.length,
      counterNotes: parsed.counter?.length,
      bassNotes: parsed.bass.length,
      chordNotes: parsed.chords.length,
      totalTime: parsed.totalTime
    })

    // Normalize into { notes, totalTime } shape to match existing layer format
    return {
      lead:    { notes: parsed.lead,          totalTime: parsed.totalTime },
      counter: { notes: parsed.counter ?? [], totalTime: parsed.totalTime },
      bass:    { notes: parsed.bass,          totalTime: parsed.totalTime },
      chords:  { notes: parsed.chords,        totalTime: parsed.totalTime },
      meta: {
        key: parsed.key,
        tempo: parsed.tempo,
        source: 'claude'
      }
    }

  } catch (err) {
    console.warn('[ClaudeComposer] Failed — will use algorithmic fallback.', err.message)
    return null
  }
}

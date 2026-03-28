# AI Melody Generator

Browser-based AI melody generator powered by Magenta.js (MelodyRNN) and Tone.js — no backend required.

## Quickstart

```bash
npm install && npm run dev
```

Then open `http://localhost:5173`.

## Usage

1. Pick a mood/genre (Jazz, Classical, Lo-Fi, Pop, Random)
2. Optionally enter 1–3 seed notes (e.g. `C4 E4 G4`)
3. Set your tempo with the slider
4. Click **Generate Melody** and watch the piano roll fill in
5. Hit **Play** to hear it

## Known Limitations

- The Magenta MelodyRNN model takes **5–10 seconds to load** on first run (fetches ~20MB checkpoint from Google Cloud Storage). A stub C-major scale plays immediately if the model hasn't loaded yet, so the demo is always functional.
- Requires a modern browser with Web Audio API support (Chrome/Firefox/Safari 2022+).

## Stack

- React + Vite (JavaScript)
- [Magenta.js](https://magenta.tensorflow.org/js) — MelodyRNN via CDN
- [Tone.js v14](https://tonejs.github.io/) — audio scheduling and synthesis
- Plain CSS Modules — no UI library dependencies

## Built at

HackAtlanta 2026

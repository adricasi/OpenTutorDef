# Observations (fixtures + videos)

Status 2026-10-24 09:20: **3 recordings + 2 screen videos** from the owner (iPad, iPadOS 26.2, Safari, Apple Pencil; canvas 1194×628 CSS px, dpr 2). None had checkpoints, `truth` or `expect`. Claude drafted them into sidecars (`fixtures/annotations/<recording>.json`, `draftedBy: "claude"`, `confirmed: false`) **for the owner to confirm**.

## Inventory

| file | mode (recorded → actual) | duration | strokes (final / drawn) | points | checkpoints | `truth` | `expect` | video |
|---|---|---|---|---|---|---|---|---|
| `rec-math-math-22r_69` | math | 154 s | 37 / 135 (85 erase events) | 3 940 | 0 raw → 4 drafted (step, mistake, step, mistake) | drafted | drafted | `rec-math-math-22r_69.mp4` (216 s) |
| `rec-math-consulting-case-z1b_a2` | **math → consulting** | 75 s | 92 / 92 | 8 527 | 0 raw → 1 drafted (final) | drafted | drafted | `rec-math-consulting-case-z1b_a2.mp4` (72 s) |
| `rec-math-page-d9x_co` | math (photo only) | 44 s | 0 | 0 | 0; 1 photo (1600×1200) | drafted (photo) | drafted (photo) | — |

**Flag: every `truth` was empty.** The drafts need your confirmation, especially:
- what the empty box after "=" means in integral 1;
- the slash next to the last 0 of 250 ÷ 25;
- the consulting problem statement, which I inferred from the title and heading.

### What is on the pages

- **Math (intent: "Correct integral, incorrect one, correct division, stuck division").**
  - 0–50 s: ∫₂⁴ x²+3 dx = [x³/3 + 3x]₂⁴ = 4³/3 + 3·4 − (2³/3 + 3·2), then "= □" (correct).
  - 54–89 s: ∫₀¹ x³ dx = [x⁵/3]₀¹ = 1⁵/3 = 1/3 (wrong antiderivative; should be x⁴/4 → 1/4).
  - 90–105 s: page wiped with the eraser.
  - 109–129 s: 250 ÷ 25 = 10 (correct).
  - 131–149 s: 248 ÷ 4, quotient digit 5, 24 − 20 = 4, bring down 8 → 48, then stops. Stuck: the digit should be 6.
  - The divisions use the Spanish layout: dividend left, divisor right under a "└" bracket, quotient under the divisor, partial products/remainders under the dividend.
- **Consulting:** issue tree "VC to acquire laptop company" → Market opportunity / Synergies / Financials (→ Price / Revenue / Costs). Branches are drawn as separate "/", "\" strokes plus a short "_" tick, not as closed boxes.
- **Photo:** "2x + 5 = 4x ; 5 = 4x − 2x ; 5 = 3x ; x = 5/3" (4x − 2x ≠ 3x), then "∫₀² √(x+2) dx = 1/√(x+2) ]₀² = … = 1/√4 − 1/√2 =" (wrong antiderivative, unfinished). Blue pen, photographed at an angle.

### Pauses, size, pressure (from the event logs)

- **Pen-up gaps:**
  - math: median 364 ms, p90 1.7 s;
  - consulting: median 117 ms, p90 0.9 s.
- In maths, **40 gaps exceed the 700 ms debounce**, and thinking pauses of 2.3–6 s fall *inside* a solution (e.g. 4.6 s at 49 s, 5.2 s at 76 s, 6.1 s at 114 s; the video shows the owner resting on "x³ dx =" before writing the antiderivative). Consequence for the agent: a line still being written must not be graded at the first 700 ms pause. The design therefore treats the active line as "settling" (checked after 2.5 s idle or when the pen moves to another line), and marks are withdrawn when their line changes.
- **Handwriting size:** median stroke height 27 px (math), 18 px (consulting text). One line of maths with limits/fractions is ~120–150 px tall. The page is wide and short (1194×628), so the owner fills it in about 90 s and wipes it. A scroll/next-page affordance matters.
- **Pressure is light:** median 0.16, max ~0.35. Width-from-pressure must not make strokes vanish; the recorder's `0.45 + 1.1·p` floor is right.
- Videos have **no narration** (audio −78 dB / −91 dB): no transcript.
- Auto-sync worked on the iPad: all three arrived through get_recordings without "Send to Mac".

### Recognition findings (Phase 3 groundwork)

- `mathnote-ocr` 0.2.1 on these strokes: simple pieces are fine (`x^{3} d x`, conf 0.81), but this writer's 1 / 5 / 0 are misread (`l`, `s`, dropped). Whole lines are unusable (conf 0.5–0.6). It needs fine-tuning on the owner's handwriting before it can be tier 1 alone.
- Qwen3.5-4B (MLX 4-bit) on rasterized crops:
  - integral 1: exact;
  - integral 2: exact except the denominator (/5 instead of /3);
  - 250 ÷ 25: exact;
  - 248 ÷ 4: divisor and quotient swapped.
  - 2–3 s per line, 3.5 GiB peak.
  - So tier 1 = geometry first (regions, the division bracket, which also prevents that swap) + Qwen3.5-4B reading, with confidence gating. The 300 ms tier-1 target is not met by a VLM; latency is masked per UX ("checking" shimmer).

## Video pipeline

- `uv run tools/video/extract_frames.py` (ffmpeg 7.0 + ffprobe from the `static-ffmpeg` pip package, no brew) processed both owner videos: 225 + 74 frames, 8 + 3 contact sheets, audio (silent).
- Fixed: frame sampling assumed 30 fps; it now reads the source rate (iPad screen recordings are typically 60 fps, which used to give 2 frames/s). `info.json` now records `source_fps`.
- Transcripts: `uv run --with mlx-whisper tools/video/extract_frames.py`. Whisper weights go to `models/weights/hf/`. This has not been exercised yet because no narrated video exists.

## What the recorder actually captures (read from `tools/recorder/ink-recorder.html`)

These facts matter for the Phase 1 loader and the replay test:

- Points are `[t_ms, x, y, pressure, tiltX, tiltY]` in CSS px of the canvas, with `t` relative to session start (rounded to 0.1 ms; x/y to 0.1 px; pressure to 0.001).
- Moves under 0.3 px in both axes are dropped, so the point density is lower than raw pointer events. Coalesced events are used when the browser provides them.
- Fingers are ignored unless "finger draws" is toggled; that matches ARCHITECTURE §3 palm rejection. The first active pointer wins; a second simultaneous pointer is ignored.
- The eraser removes **whole strokes** whose points come within 12 px of the eraser, and logs `erase {ids, x, y}`. Undo/redo of erases are logged as `undo|redo {action, ids}`. A replay must apply `events[]` in order, not just `pages[].strokes`, to reproduce intermediate states. The final `pages[].strokes` already excludes erased strokes.
- A checkpoint's `strokeIds` lists **every stroke on the page at that moment**, not just the step's strokes. The "anchors must reference existing strokes" assertion (RECORDINGS.md §5) uses exactly that set. Which strokes form *the step* is not recorded; it has to come from line grouping or diffing consecutive checkpoints.
- `snapshot` is a 1× PNG on white without the dot grid, for humans and rasterizer sanity checks only.
- Strokes have a constant `width`; pressure only changes rendered width (`width × (0.45 + 1.1·p)` for pen). The server rasterizer should use the same formula so its PNGs match the snapshots.
- Pages carry `width/height/dpr` captured at page creation. Later `viewport` events (rotation) are logged but don't rescale existing strokes.

## How recordings get here

`get_recordings/get-recordings` serves this recorder through a Cloudflare quick tunnel with a QR code, and auto-saves every ended or annotated session into `recordings/`. From there they get moved into `fixtures/recordings/`, and videos into `fixtures/videos/`. Details in `get_recordings/README.md`.

## Contradictions with UX.md (flagged, not applied)

1. **A wiped page.** The owner erases the whole page to continue (the page is short). UX.md assumes marks stay anchored to strokes; when the anchored strokes are erased, the marks go too (retract). That is consistent, but it means the tutor's history of the integral mistake disappears with the ink. Is a session history in the side panel wanted? *Owner's call.*
2. **Long division** is not mentioned in UX.md's maths section. I assume the same marks apply (✗ on the wrong quotient digit, underline the partial product, ghost digit beside it on hint level 3).
3. **Consulting trees are drawn with bracket strokes, not boxes.** UX.md's diagram vocabulary (circle a box, dashed ghost box between components) maps onto system-design boxes-and-arrows. For issue trees I'd use pins on branch labels and dashed ghost *branches* (a stroke plus label in the tutor's hand). Same principle, different shape.

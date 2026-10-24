# Videos (owner screen recordings)

The owner may drop screen recordings of real sessions into `fixtures/videos/` (iPad Control Center recording, or QuickTime on the Mac). They show what actually happened on screen while a fixture was recorded: pen behaviour, hesitations, erasing, where the owner paused and expected feedback, and — if narrated — what they were thinking.

## What videos are for, and not for

- **For:** UX reference. Timing of pauses (the natural pen-up debounce), how big the handwriting is, how diagrams grow, where the owner would want a mark, what the owner says they expect. Use them to write `docs/OBSERVATIONS.md` and to sanity-check that the recorder fixtures match reality.
- **Not for:** test data. The recognizer is tested against `fixtures/recordings/*.json` (strokes + `truth`), never against frames. Do not try to reconstruct strokes from video.

## How to look at a video

```bash
uv run tools/video/extract_frames.py                     # processes everything in fixtures/videos/
uv run --with mlx-whisper tools/video/extract_frames.py  # + transcript.txt for narrated videos
```

ffmpeg/ffprobe come from the `static-ffmpeg` pip package declared inline in the script (owner preference: Python ffmpeg, no brew); its binaries live in the repo-local uv cache. Whisper weights go to `models/weights/hf/`.

This writes, next to each video, `frames/` (1 fps + scene changes), `sheet_*.jpg` contact sheets, `audio.wav`, and `transcript.txt` with timestamps when whisper is available.

Workflow for Claude Code:
1. Open the contact sheets first (`view` the jpgs) to get the arc of the session in a few images.
2. Open individual frames around the interesting moments: the first stroke of each line, each pause > 2 s, each erase, the final state.
3. Read `transcript.txt` and align it with the frames by timestamp.
4. If a recording JSON exists for the same session (match by title/time), align its `checkpoints[].t` with the video timeline; note any mismatch.
5. Write findings to `docs/OBSERVATIONS.md`: per video, 5–15 bullets — pause lengths, handwriting size in px, erase patterns, moments where feedback should appear, phrasing the owner used for what they expected, anything that contradicts `docs/UX.md` (flag it; do not silently change UX).

## Matching videos to recordings

Name videos like the recording: `rec-math-integration-by-parts-ab12cd.mov` ↔ `rec-math-integration-by-parts-ab12cd.json`. If names differ, use the session title and duration.

## Storage

`fixtures/videos/` is git-ignored except `.gitkeep`; keep videos local. Frames and sheets are regenerated on demand.

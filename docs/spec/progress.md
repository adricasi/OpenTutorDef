# Progress log: Open Tutor

Milestones, newest last. Details per change are in [CHANGELOG.md](../../ink-tutor/docs/CHANGELOG.md).

<!-- Entry format:
## YYYY-MM-DD — <milestone> (done | partial | blocked)
- Done: what was completed
- Issues: problems found
- Next: the next step
-->

## 2026-10-24 — Canvas tutor, phases 0–10 (done; Phase 7 partial)
- Done: protocol and server skeleton, hand-rolled canvas, maths end to end with sympy checkers, hint ladder with ghost ink, provider toggle with local fallback, diagram, photo (Chandra on demand) and voice (Silero, Parakeet, Kokoro), pairing via QR and token-gated Cloudflare tunnel, accounting and sudoku modes, `make demo`.
- Decisions: Gemma 4 26B-A4B is the default local tutor (DECISIONS #25); `make ipad` is the usual way in (#26); voice stays local (#27).
- Issues: language mode acceptance waits for a recording.

## 2026-10-24 — Teacher view and screen tutor (partial)
- Done: teacher view (homework, learning log, summaries, CSV); overlay helper (Phase 11); screen tutor server side and guide loop (Phases 12–13).
- Issues: no recorded Excel pivot-table fixture yet; live voice run to verify.

## 2026-10-24 — Evaluation on the real maths recording
- Setup: `make judge MODEL=gemma4-26b-a4b`, one Apple Pencil recording of integrals, 4 checkpoints (2 correct steps, 2 mistakes), 4 runs.
- With the pipeline: deterministic checks 16/16; LLM judge 15/16; wrong steps found 2/2 (sympy); full solution never given unprompted; first mark median 2.6 s in the latest run, 2.6–5.3 s across runs.
- Baseline, plain Gemma 4 with an image and "Check my work.": judge 1/4; wrong steps found 0/2; full solution given at 3/4 checkpoints.
- Issues: one page, maths only, the judge is itself a language model. It shows the approach works; it isn't a study.

## 2026-10-24 — Start screens and chat column (in progress)
- Done: start flow (nickname → subject → problem, nickname remembered), chat column with typed questions (`chat.text`) answered like spoken ones.
- Next: merge to main (to verify), accessibility review (T-028), `make offline-check` (T-022).

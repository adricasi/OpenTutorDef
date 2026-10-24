# 0012. A teacher view on the Mac: homework, a learning log and a short summary

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #33

## Context
Teachers want to see whether children did their homework and how it went, without a separate
service, accounts, or an internet connection.

## Options considered
1. **A separate teacher app with accounts** — Cons: more to run for one Mac and one class.
2. **Log strokes and images for review** — Cons: large; the checkers' verdicts already say what
   matters.
3. **An LLM-only progress report** — Cons: counts must be exact, not generated.
4. **Deterministic learning log from stored events, worded by the local tutor when it is idle** —
   Pros: exact counts, no new service. Cons: summaries wait for an idle model.

## Decision
We use option 4. A teacher sets a homework at `/teacher`; students open `/?hw=<id>` (link + QR)
and type a first name. `progress.py` computes the log (✓/✗ per checker, hints per level, time on
task, mistakes fixed, finished) from stored feedback plus a small `activity` table; no strokes or
images are logged. The local tier-2 tutor writes a 2–5 sentence summary only when it is already
loaded and idle (new ink cancels it), else a deterministic template is used. `/teacher` answers on
localhost/LAN only; through the tunnel it is refused even with a student's pairing cookie unless
`TEACHER_TOKEN` is set. CSV export escapes formula-like cells.

## Consequences
- Positive: progress data stays on the Mac; counts are reproducible.
- Negative: first names only, no authentication of students; one Mac, one class.

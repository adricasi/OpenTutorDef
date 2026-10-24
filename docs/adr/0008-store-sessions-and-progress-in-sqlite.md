# 0008. Store sessions and progress in SQLite on the Mac

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #33 (and ARCHITECTURE §4.1, CHANGELOG Phase 1)

## Context
Sessions, pages, strokes, readings and feedback must survive a restart, stay on the Mac, and
later feed the teacher's learning log. There is one Mac and no administrator.

## Options considered
1. **In-memory only** — Cons: lost on restart; no teacher view.
2. **A database server (Postgres, etc.)** — Cons: another service to install and run offline.
3. **SQLite, a single file under `tutor-app/.data/`** — Pros: in the Python standard library,
   zero setup, easy to back up. Cons: one writer at a time.

## Decision
We use option 3. [`store.py`](../../tutor-app/apps/server/src/inktutor_server/store.py) keeps
sessions, pages, strokes, readings and feedback (JSON blobs keyed by id, one writer lock), plus the
teacher view's homework, a small `activity` table and cached summaries. Rasters and photos are
files. Screen-tutor sessions are not stored. `.data/` is git-ignored.

## Consequences
- Positive: no extra service; the learning log is computed from what is already stored.
- Negative: scale is one Mac and one class; there is no multi-machine sync.

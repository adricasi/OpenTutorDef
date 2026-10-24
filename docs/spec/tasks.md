# Tasks: Open Tutor

- Status: In review
- Last updated: 2026-10-24
- Source: [ROADMAP.md](../../ink-tutor/docs/ROADMAP.md) phases 0–13, [CHANGELOG.md](../../ink-tutor/docs/CHANGELOG.md), and the code under `tutor-app/`

Legend: `[ ]` Not started · `[~]` In progress · `[x]` Done · `[!]` Blocked.
Each task lists the requirements it serves and its "Done when" from the ROADMAP.

## Milestone 1: Foundations

- [x] T-001: Fixtures exist (Phase 0)
  - Requirements: REQ-001, REQ-009
  - Done when: ≥ 5 recordings with a `final` checkpoint and `truth` filled. To verify: the count of annotated recordings in `ink-tutor/fixtures/`.
- [x] T-002: Protocol + server skeleton (Phase 1)
  - Requirements: REQ-001, REQ-014
  - Scope: `packages/protocol` (pydantic, `schema.json`, generated TS, snapshot test), FastAPI, SQLite store, fixture loader and replay.
  - Done when: a replay test streams a fixture into the WebSocket and the store holds it (`tests/test_replay.py`).
- [x] T-003: Canvas with ink and tutor layers (Phase 2)
  - Requirements: REQ-001, REQ-004, REQ-005
  - Scope: hand-rolled canvas (DECISIONS #15 replaced tldraw), palm rejection, dirty tracker, marks, ghost ink, chips, hint popover, PWA manifest.
  - Done when: Playwright drives a fixture into the canvas with the same stroke count and points within 1 px (`apps/web/e2e/fixture-into-canvas.spec.ts`).

## Milestone 2: Tutoring core

- [x] T-004: Maths end to end, local (Phase 3)
  - Requirements: REQ-002, REQ-003, REQ-004, NFR-001
  - Scope: rasterizer, region grouping, Qwen3.5-4B reader (mathnote-ocr kept as optional extra), `math.equivalent` (sympy), LocalMLX tutor, runtime, `make judge`.
  - Done when: maths fixtures pass tier-1 thresholds, mistakes get ✗ + underline, steps get ✓, first mark < 4 s, new ink cancels the review. Note: median first mark 2.6–5.3 s across runs, so < 4 s holds for the median of the latest run only.
- [x] T-005: Hints, questions, ghost ink (Phase 4)
  - Requirements: REQ-002, REQ-005
  - Done when: LLM judge ≥ 80% on maths `expect`s (15/16 over 4 runs); no level-4 hint without an explicit request (`tests/test_agent.py`).
- [x] T-006: Provider toggle with local fallback (Phase 5)
  - Requirements: REQ-015, NFR-003
  - Done when: the same fixture gives valid feedback from local, Anthropic and OpenAI; the UI shows who answered (`tests/test_agent_providers.py`).

## Milestone 3: More subjects and inputs

- [x] T-007: Diagram mode (Phase 6)
  - Requirements: REQ-009, REQ-003
  - Done when: diagram node/edge `truth` ≥ 85%, judge ≥ 75%. To verify: the measured numbers.
- [~] T-008: Language mode (Phase 7)
  - Requirements: REQ-009, REQ-002
  - Status: built; acceptance pending a language recording (CHANGELOG). CJK stroke-order playback not built.
  - Done when: text CER ≤ 10% on fixtures; judge ≥ 75%.
- [x] T-009: Photos (Phase 8)
  - Requirements: REQ-008, NFR-002
  - Done when: photo fixture `truth` matches; Chandra unloaded after each job (`tests/test_photo.py`).
- [x] T-010: Voice (Phase 9)
  - Requirements: REQ-006, NFR-004
  - Done when: speech end → first audio < 1.5 s local; barge-in < 200 ms. To verify: timings were not found in an automated test. Cloud realtime voice was dropped (DECISIONS #27).
- [x] T-011: Polish for the demo (Phase 10)
  - Requirements: REQ-011, REQ-009
  - Scope: QR pairing + Bonjour, `make pair` / `make ipad` tunnel, accounting and sudoku modes, memory watchdog UI, `make demo`.

## Milestone 4: Screen tutor

- [x] T-012: Overlay helper (Phase 11)
  - Requirements: REQ-013
  - Done when: a server-sent highlight + caption appears over Excel in the right place; multi-display tested by logic (`make overlay-test`).
- [~] T-013: Perception (Phase 12)
  - Requirements: REQ-013, NFR-003
  - Status: server side built (frames with change gate, AX search/predicates, secure-field/blocklist pause). Open: a recorded Excel pivot-table fixture (ROADMAP backlog).
  - Done when: AX finds Excel's "Insert" in < 100 ms and a pivot-table walkthrough fixture exists.
- [~] T-014: Guide loop (Phase 13)
  - Requirements: REQ-013, REQ-006
  - Status: planner, stepper, AX-first locating with VLM fallback, auto-advance, replanning and voice controls built (`tests/test_screen_guide.py`). To verify: a live run with voice on a real recorded fixture.
  - Done when: pivot-table replay ≥ 90% targets by AX and auto-advance within 1 s; a live run works with voice.

## Milestone 5: Classroom and start flow

- [x] T-015: Teacher view
  - Requirements: REQ-012, NFR-003
  - Scope: `/teacher`, homework link + QR, per-student table, learning log, 2–5 sentence summaries, replay, CSV (`tests/test_teacher.py`, `TeacherPage.test.tsx`).
- [x] T-016: Start screens (nickname → subject → problem)
  - Requirements: REQ-010
  - Status: done on branch `feat/start-screens` (`ui/start/StartFlow.tsx`, `StartFlow.test.tsx`); merge to `main` pending.
- [x] T-017: Chat column with typed questions (`chat.text`)
  - Requirements: REQ-007, REQ-005
  - Status: done on branch `feat/start-screens` (`ui/chat/ChatPanel.tsx`, `tests/test_chat_text.py`), checked end to end against the live server; merge to `main` pending.
- [x] T-018: Typeset formulas beside voice answers and tutor maths with KaTeX
  - Requirements: REQ-006, REQ-004
  - Verified by: `apps/web/src/pagemath.test.tsx`, `tests/test_formula.py`
- [x] T-019: Plain-model baseline evaluation
  - Requirements: NFR-001, REQ-005
  - Scope: `inktutor_server/eval/baseline.py`; compared with `make judge` (see progress.md).

## Backlog (from ROADMAP)

- [ ] T-020: Offline pairing over hotspot/LAN with a local HTTPS certificate (mkcert) — REQ-011, REQ-014
- [ ] T-021: Export/import a student's work by file/USB — REQ-012, REQ-014
- [ ] T-022: `make offline-check` proving no network after models are downloaded — REQ-014, NFR-005
- [ ] T-023: Smaller local tutor model for 16 GB Macs — NFR-002
- [ ] T-024: Keep tier 2 resident when tier 1 loads; measure screen-plan latency — NFR-001, NFR-002
- [ ] T-025: Screen tutor: push-to-talk hotkey, echo cancellation on macOS 14, Numbers and Finder walkthroughs — REQ-013
- [ ] T-026: Teacher view: merge same-name students, gate `GET /api/sessions/{id}` through the tunnel, per-student CSV rows — REQ-012, NFR-003
- [ ] T-027: Real recordings for sudoku, accounting and language; judge `mistake` rule for sudoku — REQ-009
- [ ] T-028: Accessibility review of the canvas, start screens and chat — NFR-004

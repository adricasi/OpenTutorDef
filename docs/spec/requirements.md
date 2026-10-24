# Requirements: Open Tutor

- Status: In review
- Last updated: 2026-10-24
- Related: [product.md](product.md) · [design.md](design.md) · [tasks.md](tasks.md)

Paths in "Verified by" are relative to `tutor-app/`. Server tests: `apps/server/tests/`; web tests:
`apps/web/src/**/*.test.ts(x)`; end-to-end: `apps/web/e2e/`. `make judge` replays the real maths recording
(4 checkpoints) and scores deterministic checks plus an LLM judge. "To verify" marks a criterion that no test
found during this write-up covers.

## Functional requirements

### REQ-001 Handwriting capture and the canvas
The student writes with an Apple Pencil (or mouse on the Mac) on a canvas that keeps the ink as strokes and draws the tutor's marks on a separate layer.
- AC-1: Strokes keep per-point time, x, y, pressure and tilt; moves under 0.3 px are dropped.
- AC-2: Fingers are ignored by default (palm rejection); a toggle lets fingers draw.
- AC-3: After pen-up plus a 700 ms debounce, the client sends `ink.update` with changed and removed strokes; it never sends images of ink.
- AC-4: The eraser removes whole strokes; undo/redo work; the tutor never changes the student's strokes.
- AC-5: A replayed recording drawn through pointer events reaches the server with the same stroke count and points within 1 px.
- Verified by: `apps/web/src/ink.test.ts`, `apps/web/src/session.test.ts`, `apps/web/e2e/fixture-into-canvas.spec.ts`, `tests/test_replay.py`

### REQ-002 Reading handwriting (tier 1)
The Mac reads each settled line of ink locally with Qwen3.5-4B (MLX) and returns a `Reading` with confidence and alternatives.
- AC-1: Strokes are grouped into regions/lines before reading; each `ReadingLine` lists its stroke ids, bbox, LaTeX or text, confidence and alternatives.
- AC-2: A line is graded only once it settles (2.5 s pen-up idle, or the pen starts another line) (DECISIONS #16).
- AC-3: A low-confidence line gets a `question` chip and is not graded until the student answers; "No" stops grading it.
- AC-4: The student can correct a reading (`line.correction`), by typing or by dictation.
- AC-5: Maths lines meet `max_cer = 0.15` and text lines `max_cer = 0.10` on the recordings (`tests/thresholds.toml`).
- Verified by: `tests/test_tier1_accuracy.py`, `tests/test_regions.py`, `tests/test_agent.py::test_low_confidence_asks_instead_of_grading`, `tests/test_correction.py`, `apps/web/src/correction.test.tsx`

### REQ-003 Deterministic checkers
Where a checker exists for the mode, code decides whether a step is right.
- AC-1: `math.equivalent` (sympy) decides equivalence of consecutive steps, including integrals and evaluated antiderivatives.
- AC-2: Arithmetic, double-entry ledger balance (accounting), sudoku rules and graph rules (diagrams) each return a `CheckResult {ok, kind, anchor, detail}`.
- AC-3: Checker marks are emitted without waiting for the language model.
- AC-4: The language model may not contradict a checker; if it disagrees it asks a question instead of marking.
- Verified by: `tests/test_checkers.py`, `tests/test_accounting.py`, `tests/test_sudoku.py`, `tests/test_diagram.py`, `tests/test_agent.py::test_checker_marks_and_tutor_rules`, `make judge` (2/2 mistakes found)

### REQ-004 Marks on the page
Feedback appears as small marks anchored to the line or strokes it is about.
- AC-1: A correct step gets a ✓ and nothing else; a wrong step gets ✗ plus an underline on the wrong segment.
- AC-2: `FeedbackEvent`s that reference unknown anchors are dropped.
- AC-3: New ink on a line retracts that line's marks and cancels the review in flight.
- AC-4: On the maths recording, every scored checkpoint has its marks on the expected line.
- Verified by: `tests/test_agent.py::test_new_ink_retracts_marks_of_the_changed_line`, `tests/test_agent.py::test_new_ink_cancels_the_review_in_flight`, `make judge` (deterministic 16/16 over 4 runs)

### REQ-005 Hint ladder (never the full solution unprompted)
Tapping a mark opens hints at increasing levels: 1 nudge, 2 rule, 3 corrected step as ghost ink, 4 full solution.
- AC-1: Level 4 is refused unless the student explicitly asks for the solution (tap, voice or typed).
- AC-2: Hints are cached per line content.
- AC-3: Ghost ink can be kept (becomes solid) or dismissed, and retires when the student writes the fix themselves.
- AC-4: On the maths recording, the tutor gives the full solution unprompted at 0 checkpoints.
- Verified by: `tests/test_agent.py::test_hint_ladder_level4_needs_explicit_request`, `tests/test_agent.py::test_ghost_retires_when_the_student_writes_the_fix`, `tests/test_voice.py::test_spoken_hint_ladder_commands`, `apps/web/src/ui/chat/ChatPanel.test.tsx`, `make judge`

### REQ-006 Voice
The student can talk to the tutor and hear answers, all locally.
- AC-1: Voice loads only when a session turns it on: Silero VAD (350 ms end of utterance) → Parakeet TDT STT → tutor → Kokoro TTS.
- AC-2: Spoken hint-ladder commands ("just a hint", "more", "show me the step", "the solution" = explicit) work in EN/ES/CA.
- AC-3: Answers are spoken sentence by sentence while they stream; each spoken sentence is mirrored as a `speak` event.
- AC-4: The student's speech pauses the tier-2 review; barge-in stops playback; fillers are not answered.
- AC-5: The tutor's voice can be muted per device; captions stay.
- AC-6: Speech end → first audio < 1.5 s locally; barge-in stops playback within 200 ms (Phase 9). To verify: no automated timing test found.
- Verified by: `tests/test_voice.py`, `tests/test_language.py`, `apps/web/src/voice.test.ts`, `apps/web/src/voiceui.test.tsx`, `apps/web/e2e/voice-talk.spec.ts`

### REQ-007 Typed chat
A chat column lets the student type a question (`chat.text`), answered by the same path as a spoken question.
- AC-1: `chat.text` carries `page_id` and 1–1000 characters; empty or longer text is rejected by the protocol.
- AC-2: The answer arrives as a `speak` feedback; it is spoken aloud only when voice is already on.
- AC-3: A new typed question cancels the one being answered.
- AC-4: The column shows the student's turn and the tutor's turn without duplicates; Enter sends, Shift+Enter does not; the current hint level is highlighted.
- Verified by: `tests/test_chat_text.py`, `apps/web/src/ui/chat/ChatPanel.test.tsx`

### REQ-008 Photos of paper
The student can photograph work on paper and get the same marks on the photo.
- AC-1: `POST /api/sessions/{id}/photos` accepts a JPEG (client downsizes to ≤ 1600 px) and creates a photo page.
- AC-2: Chandra OCR 2 is loaded on demand after a memory check, reads the layout into bbox-anchored lines, and is unloaded after the job.
- AC-3: The same checkers and tutor review run on photo lines; marks anchor to bboxes on the photo.
- Verified by: `tests/test_photo.py`

### REQ-009 Subject modes
Each subject is a folder under `tutor-app/modes/` with a config, a rubric and a prompt.
- AC-1: Modes exist for math, accounting, language, sudoku, consulting, system design and screen.
- AC-2: A mode's config selects its recognizer, checkers and allowed marks.
- AC-3: Sudoku: rule conflicts are marked ✗ unprompted; the tutor explains only the next deducible move (DECISIONS #24).
- AC-4: Language: wrong words get squiggles anchored to that word's strokes; corrected phrasing only at hint level 3.
- AC-5: Every mode ships with at least one fixture and a replay test (ROADMAP "Always"). To verify: language, sudoku and accounting rely on synthetic pages; real recordings are in the backlog.
- Verified by: `tests/test_sudoku.py`, `tests/test_accounting.py`, `tests/test_diagram.py`, `tests/test_language.py`, `tests/test_fixtures.py`

### REQ-010 Start screens and nickname
Before writing, the student types a nickname, picks a subject, and can add the problem.
- AC-1: Flow is join (nickname) → subjects → start (optional problem), then the canvas opens in the chosen mode.
- AC-2: The nickname is remembered on the device, so a fresh load starts on the subjects screen.
- AC-3: A homework link (`/?hw=<id>`) asks for the student's first name and attaches the session to that homework.
- Verified by: `apps/web/src/ui/start/StartFlow.test.tsx`, `apps/web/src/teacher/HomeworkStart.test.tsx`

### REQ-011 Pairing and tunnel
A tablet connects to the Mac by scanning a QR code, over an HTTPS Cloudflare quick tunnel or the LAN.
- AC-1: `make ipad` starts the server, opens the tunnel and prints a QR code; `make pair` opens the tunnel next to a running server.
- AC-2: Requests through the tunnel need the pairing token; the token in the query sets an HttpOnly cookie; the WebSocket through the tunnel needs the cookie.
- AC-3: LAN and localhost requests stay open; `/healthz` is open through the tunnel.
- AC-4: Rotating the token (`pair --new-token`) locks out old cookies.
- AC-5: The "Pair iPad" dialog shows LAN and tunnel URLs when available.
- Verified by: `tests/test_pairing.py`, `apps/web/src/pairing/PairingPage.test.tsx`

### REQ-012 Teacher view
A teacher creates homework and sees each student's progress, all stored on the Mac.
- AC-1: `/teacher` creates homework with a link and QR code.
- AC-2: Per homework, a table shows each student's status (done / in progress / not started), time, hints, mistakes fixed and a 2–5 sentence summary.
- AC-3: The summary comes from the local tutor, or a deterministic template if the tutor is busy or its output is unusable; a cloud summary only when the session is cloud and asked.
- AC-4: A read-only replay of each session shows the tutor's marks; CSV export works.
- AC-5: Teacher routes are refused through the tunnel unless `TEACHER_TOKEN` is presented.
- Verified by: `tests/test_teacher.py`, `apps/web/src/teacher/TeacherPage.test.tsx`

### REQ-013 Screen tutor (desktop software)
On the Mac, a native overlay helper and the server walk the user through a software task with highlights, arrows and captions.
- AC-1: The overlay draws `OverlayEvent`s (highlight, arrow, caption, pulse, clear) click-through, above full-screen apps, per display.
- AC-2: `/ws/screen/{id}` is localhost only.
- AC-3: The guide plans a goal into ≤ 15 steps, locates targets by the accessibility tree first and a rate-limited VLM fallback, and auto-advances when `done_when` holds; a click or drag on the highlighted control completes the step.
- AC-4: Voice controls next / back / repeat / pause / stop; barge-in stops speech.
- AC-5: A secure field or blocklisted app pauses the guide ("I'll wait").
- AC-6: The pivot-table replay resolves targets by AX and auto-advances.
- Verified by: `tests/test_screen.py`, `tests/test_screen_guide.py`, `tests/test_screen_perception.py`, `tests/test_overlay_contract.py`, `make overlay-test`

### REQ-014 Local-only and offline
All models run on the Mac; after `make models`, a session in local mode needs no network.
- AC-1: Tier 1, checkers, tier 2 (local), voice and photos run through MLX on the Mac.
- AC-2: `make build && make server` serves the app at `http://localhost:8000` with no network.
- AC-3: Model repos and revisions are pinned in `ink-tutor/models/manifest.toml`.
- AC-4: No outbound connection during a local session. To verify: no `make offline-check` yet (ROADMAP backlog).
- Verified by: `tests/test_providers.py::test_privacy_only_tutoring_data_leaves` (partial)

### REQ-015 Optional cloud provider with fallback
The tutoring step (tier 2 only) can be switched per session to a cloud provider with a key in `tutor-app/.env`.
- AC-1: Providers are local, Anthropic and OpenAI behind one interface; the same fixture gives structurally valid feedback from each.
- AC-2: Keys live only server-side in `.env`.
- AC-3: If a cloud call fails or refuses, the local model answers and the page shows "<provider> unavailable — answering locally".
- AC-4: Recognition and voice never leave the Mac (DECISIONS #2, #27); only the tutoring request is sent.
- AC-5: The UI badge shows which provider and model answered.
- Verified by: `tests/test_agent_providers.py`, `tests/test_providers.py`

## Non-functional requirements

### NFR-001 Latency
- AC-1: First mark (local) median within 2.6–5.3 s across `make judge` runs on the M3 Pro (latest run median 2.6 s); ARCHITECTURE target < 4 s.
- AC-2: Checker marks arrive 1.7–3.9 s after pen-up (MODELS.md).
- AC-3: Tier-1 reading < 300 ms after debounce and hint response < 2 s (ARCHITECTURE §9). To verify: measured tier-1 reads are 2–3.5 s per line (MODELS.md), so this target is not met as written.
- Verified by: `make judge`

### NFR-002 Memory
- AC-1: Everything resident fits the 32 GB budget on a 36 GB Mac; never two tier-2 models at once.
- AC-2: A tier-2 model loads fully resident only with `memory_gb` + 6 GiB free; otherwise from its expert-offload store with 2 GiB headroom; otherwise it refuses.
- AC-3: A watchdog moves a full model to offload if free memory stays under 2 GiB.
- AC-4: The tier-1 reader loads lazily on first use and retries after a failed memory check.
- Verified by: `tests/test_runtime_lazy.py`; offload/watchdog: to verify (no dedicated test found)

### NFR-003 Privacy
- AC-1: Handwriting, voice and progress stay on the Mac; no accounts; the student is identified by a nickname or first name.
- AC-2: With a cloud provider on, only the tutoring request (crops, reading, checker results, transcript) is sent.
- AC-3: The tunnel is token-gated and teacher routes are closed through it by default.
- Verified by: `tests/test_providers.py::test_privacy_only_tutoring_data_leaves`, `tests/test_pairing.py`, `tests/test_teacher.py::test_teacher_routes_are_refused_through_the_tunnel`

### NFR-004 Accessibility
- AC-1: Voice in and out, and typed chat, as alternatives to writing and reading.
- AC-2: The Talk button stays reachable on every iPad size (toolbar folds into "More").
- AC-3: Interactive controls have accessible names. To verify: no accessibility audit or automated a11y test found.
- Verified by: `apps/web/src/voiceui.test.tsx` (partial)

### NFR-005 No network at inference
- AC-1: Inference uses only local MLX models or, when the session opts in, a cloud provider; never a hidden network call.
- AC-2: The web app bundles its fonts (DM Sans, Caveat) and KaTeX; no CDN at runtime.
- AC-3: Measured with upstream network off. To verify: `make offline-check` is in the ROADMAP backlog, not built.
- Verified by: to verify

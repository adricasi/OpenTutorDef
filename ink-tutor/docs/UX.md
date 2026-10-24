# UX principles and interaction design

These were worked out with the owner and are binding. When in doubt, the test is: *would a good teacher do this with a red pen on the student's paper?*

## The one rule: the agent never touches your ink

The user's handwriting stays the only content on the page. Nothing is replaced, snapped, typeset or redrawn. Three layers:

1. **Ink** — the user's strokes. Only the user edits them.
2. **Tutor** — the agent's output. Marks and ghost ink anchored to the user's strokes. The user can erase, accept or dismiss, nothing else.
3. **Popovers / side panel** — explanations, hints, the voice transcript. Appear on tap or when the tutor speaks, then get out of the way.

The machine's internal reading (LaTeX, transcript, graph) is **not** shown by default. It surfaces in exactly two cases: a low-confidence chip ("I read this as ∂ — correct?") next to the stroke, and a debug pane the user opens on purpose ("show what you read").

## How the tutor marks

- **Marks:** ✓ / ✗ / ? in the margin beside a handwritten line; an underline under the exact strokes that are wrong; a circle around a box in a diagram; a numbered pin where something is missing. Small, colour-coded by severity, never text-heavy.
- **Ghost ink:** when the tutor writes (a corrected step, a missing component, a better phrasing) it writes *on the page, in its own hand*: a handwriting-style font, dashed or lighter, in a contrasting colour, placed in the margin or the empty space beneath the user's line. Visibly not the user's handwriting. Accept → it becomes solid; dismiss → gone; or the user rewrites it by hand and the ghost retires once the recognizer sees the fix.
- **Hint ladder:** tapping a mark opens level 1 (nudge: "check the sign"). "More" → level 2 (hint: "the integral of eˣ is…"), level 3 (the corrected step as ghost ink), level 4 (full solution, only on explicit request).
- **Questions before grades:** if the reading is uncertain, the tutor asks with a one-tap chip instead of marking.
- **Latency masking:** marks arrive a few seconds after pen-up with a subtle per-line "checking" shimmer; the page never freezes. New ink cancels pending feedback.

## Per subject

- **Maths:** marks per line; underline on the offending strokes (the math recognizer knows which strokes made which symbol); ghost corrected step beneath the user's line. Never typeset the user's work.
- **Diagrams (system design, consulting):** the tutor only *adds*: a dashed ghost box ("cache?") in the gap between API and DB, a dashed arrow, a pin on the single point of failure. Numbered pins map to a checklist in the panel. "Show reference design" opens a clean reference in a separate pane with a diff — never on the user's page.
- **Language:** squiggle under the misspelled word on the ink; corrected phrasing as ghost ink below; for CJK, stroke-order playback of the correct character beside the user's.
- **Accounting (T-accounts):** ✓ when debits = credits; ✗ on the entry on the wrong side; ghost note in the margin.
- **Sudoku / puzzles:** the tutor explains the *next deducible move*, never fills cells.

## Voice

- The tutor speaks short things unprompted ("careful with the sign there") and says what it is marking as it marks it. Detail stays in the popover.
- The user can interrupt (barge-in). "Why is this wrong?" resolves to the stroke under the pen.
- Speech is also the hint-ladder control: "just a hint", "show me the step".
- Voice is optional and off by default; a visible mic state tells the user when it listens.

## Modes and sessions

A session = one problem/task in one mode, with the problem statement the tutor is given and an optional rubric or reference answer. The provider badge (`local · 3.4 s`, `Claude · 1.9 s`) is always visible so it is obvious which brain answered.

## Screen tutor

On the Mac, over any app (`SCREEN-TUTOR.md`). One step at a time: a highlight on the real control, an arrow only when it is far from the mouse, one short spoken line (and the same line as a caption). The user does the clicking; when the step is detected as done, the tutor moves on by itself. If the user goes another way, it replans quietly and says so in one line. It never clicks, types or scrolls for them. Its only presence is a draggable phantom icon that you just talk to (listening starts when it connects); its menu offers listen on/off, mute (captions and highlights stay), the transcript, pause and exit; a visible indicator shows when the screen is being captured.

## Teacher view

For a teacher with a class (DECISIONS #33), on the Mac at `/teacher` (or its LAN address). They create a homework (title, subject, the problem, optionally a due date and the final answer) and get a link and a QR code to share. A student who opens the link sees the homework's title and problem and types only their first name (remembered on that iPad, easy to change); then it is the normal page, nothing else changes for them.

Per homework the teacher sees one row per student: ✓ done / in progress / not started, time on task, hints asked for (and whether they asked for the full solution), mistakes they fixed themselves, and a short summary in plain words: what they practised, what they know, what they need to improve (2–5 sentences, no maths markup, no invented facts). Tapping a row opens the session read-only: the ink replayed stroke by stroke with the tutor's marks as the student saw them, erased ink on request, the learning log and the hints they got. A "sessions without homework" list and a CSV export complete it.

The summary is written by the local tutor when it is idle, otherwise from a template, so there is always something to read; Refresh rewrites it only if something changed. Children's work stays on the Mac: students can't reach the teacher view through the tunnel, and a cloud model sees the log only when the teacher asks for it on a cloud session.

## Things we decided *not* to do

- No live typeset "twin" pane next to the ink (the owner explicitly rejected converting handwriting into machine output as the experience).
- No tutor text written inline between the user's lines.
- No wholesale redraw or beautify of the user's diagram.
- No autosolving; the full solution is the last rung of the ladder and only on request.

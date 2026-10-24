# Product: Open Tutor

- Status: In review <!-- Draft | In review | Approved -->
- Last updated: 2026-10-24
- Sources: [README](../../README.md) · [ARCHITECTURE](../../ink-tutor/docs/ARCHITECTURE.md) · [UX](../../ink-tutor/docs/UX.md) · [ROADMAP](../../ink-tutor/docs/ROADMAP.md) · [DECISIONS](../../ink-tutor/docs/DECISIONS.md)
- Licence: Apache-2.0 (models keep their own licences, see README "Models")

## Problem
Students in communities with poor connectivity, or whose schools close because of storms, floods or heatwaves,
practise on paper at home with nobody to check their work. Cloud tutors need a working internet connection, and a
general chat model shown a page of work tends to judge steps wrongly and hand over the full solution.

Open Tutor is an offline tutor for work done by hand. A student writes on an iPad with an Apple Pencil (or in a
browser on the Mac). One Apple-silicon Mac reads the handwriting, checks each step with deterministic code, and marks
the page the way a teacher would: a small ✓ or ✗ on the exact line, hints only when asked, never the full solution
unprompted. After a one-time model download, no internet and no cloud API are needed.

## Users
| User | Needs | Current pain |
|---|---|---|
| **Student** (school age, poor or no internet; school closed by weather or far away) | Keep practising at home; know which step is wrong; get a nudge, not the answer | No one to check work; cloud tools need data and give away solutions |
| **Teacher** (school or community hub running one Mac) | Hand out homework, see who finished, where students struggled and how many hints they used | No view of homework difficulties until the next class |
| **Software learner** (Mac user) | Be walked through a desktop task step by step (screen tutor) | Written tutorials don't point at the real controls |

## Goals
- G-1: A student gets step-level feedback on handwritten work (✓/✗ on the exact line) with no internet at inference.
- G-2: Right/wrong is decided by code where a checker exists; the model explains and hints but may not contradict a checker.
- G-3: The student learns rather than copies: the hint ladder goes nudge → rule → corrected step → full solution, and the last level only on explicit request.
- G-4: The student can also ask by voice or by typing, and get a short answer anchored to the page.
- G-5: One Mac serves the tablets of a school or community hub; pairing is a QR code.
- G-6: A teacher sees per-student progress and summaries, stored only on the Mac.

## Non-goals
- No native iOS app; the iPad uses Safari (DECISIONS #1).
- The tutor never edits, snaps or typesets the student's ink (DECISIONS #3).
- No accounts, no cloud storage, no analytics.
- No grading: marks are a second opinion, not an official grade (README "Disclaimer").
- Not a phone app, and not a model that runs on the tablet; the iPad never runs models.
- No financial, accounting or business advice in the accounting and consulting modes.

## Success measures
| Measure | Target | How it is measured |
|---|---|---|
| Tutor behaviour on the real maths recording | LLM judge passes ≥ 80% of `expect`s (Phase 4) | `make judge MODEL=gemma4-26b-a4b` |
| Deterministic checks (anchors, marks on the right line) | 100% | `make judge` deterministic part |
| Wrong steps found on mistake checkpoints | 2/2 | `make judge`, decided by sympy |
| Full solution given unprompted | 0 checkpoints | `make judge`; `tests/test_agent.py::test_hint_ladder_level4_needs_explicit_request` |
| Time to first mark (local) | < 4 s target (ARCHITECTURE §9) | `make judge` reports median first mark |
| Network at inference | none after `make models` | to verify: no `make offline-check` target exists yet (ROADMAP backlog) |
| Use with students | to verify: not yet tested with students (README) | — |

## Constraints and assumptions
- Hardware: an Apple-silicon Mac; tested on an M3 Pro with 36 GB, 32 GB budget (ENVIRONMENT.md). About 22 GB free for the tutor model to run fully resident; otherwise the expert-offload mode from the SSD.
- One-time model download of 30–40 GB.
- Microphone in iPad Safari needs HTTPS, hence the Cloudflare quick tunnel for pairing (DECISIONS #22, #26).

<div align="center">

# Open Tutor

**An offline AI tutor for work done by hand. One Mac, an iPad and a pencil; the models never leave the Mac.**

[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![python](https://img.shields.io/badge/python-3.12-blue)](tutor-app/pyproject.toml)
[![model](https://img.shields.io/badge/model-Gemma%204%2026B--A4B%20(local)-E0892F)](#models)
[![inference](https://img.shields.io/badge/inference-100%25%20on%20the%20Mac-2e7d32)](#architecture)

[Quick start](#quick-start) · [Architecture](#architecture) · [How it works](#how-it-works) · [Run it for a class](#run-it-for-a-class-operator-guide) · [Hackathon submission](#hackathon-submission) · [Docs](#documentation) · [Contributing](#contributing)

</div>

A student writes on an iPad with an Apple Pencil, or in a browser on the Mac. The tutor reads the handwriting, checks
every step with code and marks the page the way a teacher would: a small ✓ or ✗ on the exact line, hints only when
asked, never the full solution unprompted. The student can also ask by typing in the chat next to the page, or out
loud. Every model runs on one Apple-silicon Mac, with open weights under open licences. After a one-time download,
reading, checking, tutoring and voice need no internet and no cloud API.

> **Disclaimer.** Open Tutor is a learning aid and can be wrong. Treat its marks and hints as a second opinion, not
> as grading. The accounting and consulting modes are for practising exercises, not financial, accounting or
> business advice.

## Table of contents
- [Who it's for](#who-its-for)
- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Privacy and security](#privacy-and-security)
- [Hackathon submission](#hackathon-submission)
- [How it works](#how-it-works)
- [Run it for a class (operator guide)](#run-it-for-a-class-operator-guide)
- [What expertise is inside, and where it comes from](#what-expertise-is-inside-and-where-it-comes-from)
- [Models](#models)
- [Proof that it works better with our part](#proof-that-it-works-better-with-our-part)
- [Errors, limits and disclaimer](#errors-limits-and-disclaimer)
- [Documentation](#documentation) · [Develop](#develop) · [Contributing](#contributing) · [Open-source libraries](#open-source-libraries) · [Team](#team) · [License](#license)

## Who it's for

Students who can't count on school or the internet: communities with poor connectivity, and places where storms,
floods or heatwaves close schools. They keep practising at home or at a community hub and go to school when they can.

- At least 171 million students had school disrupted by climate events in 2025, and 75% of them were in low- and
  lower-middle-income countries ([UNICEF, *Learning Interrupted*](https://www.unicef.org/reports/learning-interrupted)).
- 2.2 billion people are still offline ([ITU, Facts and Figures 2025](https://www.itu.int/itu-d/reports/statistics/facts-figures-2025/)).

It also suits anyone who learns on paper and wants a patient second pair of eyes: maths, accounting, languages,
sudoku, consulting cases and system design. A screen tutor (early work) walks people through desktop software step
by step. Product brief: [docs/spec/product.md](docs/spec/product.md).

## Quick start

**You need:** an Apple-silicon Mac (tested on an M3 Pro with 36 GB of memory), about 22 GB of memory free for the
tutor model and 30–40 GB of disk for the models, [uv](https://docs.astral.sh/uv/) and Node.js (tested with 22). An
iPad with an Apple Pencil is optional.

```sh
./setup-local.sh                          # repo-local uv/npm caches (writes uv.toml and apps/web/.npmrc)
cd tutor-app
uv sync && (cd apps/web && npm ci)        # pinned dependencies (uv.lock, package-lock.json), voice included
make models                               # one time, needs internet: the pinned open-weight models
make ipad                                 # starts the tutor and prints a QR code for the iPad
```

On the Mac, open <http://localhost:8000>: type a nickname, pick a subject, add the problem if you like, then
**Start writing**. **Pair iPad** on that screen shows the same QR code. `make build && make server` serves the app on
the Mac only, with no network at all.

## Architecture

![Open Tutor architecture: every model runs on one Apple-silicon Mac; the cloud provider is optional and off by default](media/architecture.svg)

| Part | Role | Decision |
|---|---|---|
| iPad or Mac browser | React canvas: ink and tutor layers, start screens, chat column, voice | [ADR-0014](docs/adr/0014-keep-ink-as-ink-on-a-hand-rolled-canvas.md) |
| One Apple-silicon Mac | Runs everything; offline after setup | [ADR-0002](docs/adr/0002-run-everything-on-one-apple-silicon-mac.md) |
| Session agent (FastAPI, `:8000`) | Segment → read → check → tutor, one constrained loop per page | [design.md](docs/spec/design.md) |
| Checkers | sympy, ledgers, sudoku and graph rules decide right or wrong; the model only explains | [ADR-0005](docs/adr/0005-deterministic-checkers-decide-the-model-only-explains.md) |
| Tutor model | Gemma 4 26B-A4B through mlx-vlm on `127.0.0.1`; one model resident; SSD offload under memory pressure | [ADR-0003](docs/adr/0003-serve-mlx-models-with-mlx-vlm-one-resident-tier-2-model.md), [ADR-0004](docs/adr/0004-use-gemma-4-26b-a4b-as-the-default-tutor.md) |
| Hint ladder | Nudge → rule → corrected step → full solution only on request | [ADR-0006](docs/adr/0006-hint-ladder-with-full-solution-only-on-request.md) |
| Protocol | One pydantic contract, generated TypeScript types for the web app | [ADR-0007](docs/adr/0007-share-a-pydantic-protocol-with-the-typescript-web-app.md) |
| Storage | SQLite on the Mac: sessions, strokes, marks, progress | [ADR-0008](docs/adr/0008-store-sessions-and-progress-in-sqlite.md) |
| Voice | Silero VAD → Parakeet → agent → Kokoro, all local, loaded on demand | [ADR-0009](docs/adr/0009-keep-voice-local.md) |
| Pairing | Cloudflare quick tunnel gated by a token in the QR code; the LAN stays open | [ADR-0010](docs/adr/0010-pair-the-ipad-through-a-token-gated-cloudflare-quick-tunnel.md) |
| Cloud provider | Optional, per session, tutoring step only, automatic local fallback | [ADR-0011](docs/adr/0011-optional-cloud-provider-with-automatic-local-fallback.md) |
| Teacher view | Homework links and progress, served on the Mac/LAN only | [ADR-0012](docs/adr/0012-teacher-view-on-the-mac.md) |
| Screen tutor | macOS overlay that points at controls, never clicks | [ADR-0013](docs/adr/0013-screen-tutor-overlay-points-never-acts.md) |

## Privacy and security

- Handwriting, voice, chat and progress stay on the Mac. Nothing is sent to a model API unless a session turns on a
  cloud provider, and then only the tutoring request goes.
- Students use a nickname (1–20 characters, "not your full name"); no accounts.
- Through the tunnel, every request needs the pairing token from the QR code (traded for an HttpOnly cookie). The
  teacher view and the screen-tutor socket are refused through the tunnel. Rotate the token with
  `uv run python -m inktutor_server.pair --new-token`.
- Keys, if any, live only in `tutor-app/.env`, which is git-ignored (`.env.example` has empty values).
- Dependencies are locked (`uv.lock`, `package-lock.json`, model revisions in `ink-tutor/models/manifest.toml`).
  Audit on 2026-10-24: `pip-audit` found no known vulnerabilities in the 173 locked Python packages; `npm audit`
  found one low-severity advisory (KaTeX).

## Hackathon submission

Entered in **Best Open-Source AI Project** and **Best Use of Gemma 4**. The organisers' minimum standard is below;
the same table with file-level evidence is in [docs/hackathon/CHECKLIST.md](docs/hackathon/CHECKLIST.md).

### In the repo
| Required | Status | Where |
|---|---|---|
| An open-source LICENSE | Done | [LICENSE](LICENSE) (Apache-2.0) |
| Keys only in `.env`, and `.env` in `.gitignore` | Done | No key is needed by default; optional cloud keys in `tutor-app/.env` (git-ignored) |
| No real personal data in tests or examples | Done | Fixtures are maths strokes and synthetic pages; test names are invented |
| Pinned dependencies, no critical vulnerabilities | Done | Locked; audited 2026-10-24 (see [Privacy and security](#privacy-and-security)) |
| A clear error when the model API fails, and a rate limit on a public demo | Done | Clear errors with automatic local fallback; the public link is the token-gated tunnel, which is enough for one Mac serving one class, so no per-request rate limit is added ([limits](#errors-limits-and-disclaimer)) |
| A disclaimer if you give legal, tax, medical or money advice | Done | [Disclaimer](#errors-limits-and-disclaimer), and "AI can make mistakes" on every screen |

### In this README
| Required | Status | Where |
|---|---|---|
| What it is and who it's for | Done | [Top](#open-tutor) and [Who it's for](#who-its-for) |
| How to run it | Done | [Quick start](#quick-start) and [Run it for a class](#run-it-for-a-class-operator-guide) |
| What expertise is inside, and where it comes from | Done | [Expertise](#what-expertise-is-inside-and-where-it-comes-from) |
| The model and a link to its license | Done | [Models](#models) |
| Proof that it works better with your part | Done (small) | [Proof](#proof-that-it-works-better-with-our-part) |

### What we have built
- **Handwriting tutor:** Apple Pencil canvas, handwriting and maths reading, deterministic checkers, marks anchored
  to lines, hint ladder with ghost ink, photos of paper pages.
- **Start screens and chat:** nickname → subject → problem; a chat column next to the page where the student types or
  talks, with the hint ladder shown.
- **Voice:** local speech in and out, barge-in, spoken hint commands.
- **Teacher view:** homework links, per-student progress and summaries.
- **Screen tutor (early):** a macOS overlay that guides through desktop software step by step.
- **Specification:** requirements, design, tasks and progress in [docs/spec/](docs/spec/), 14 decision records in
  [docs/adr/](docs/adr/README.md).
- **Quality:** 385 Python tests and 113 web tests, ruff and ESLint clean, a replay judge (`make judge`) and a
  plain-model baseline.

## How it works

1. **Start.** The student types a nickname, picks a subject and optionally types the problem. Pairing is the QR
   code; nothing to type on the iPad.
2. **Write.** Strokes stream to the Mac. When a line settles, the reader (Qwen3.5-4B) turns it into text or LaTeX.
3. **Check.** Checkers decide each line: sympy for algebra and calculus, ledger balances, sudoku and graph rules. A
   ✓ or ✗ with an underline appears within seconds; the model is not needed for this.
4. **Tutor.** Gemma 4 reviews the page and decides what to say. It cannot contradict a checker: a disagreement
   becomes a question to the student.
5. **Hints.** Tapping a mark, typing "hint", or saying "just a hint" climbs the ladder: a nudge, then the rule, then
   the corrected step as ghost ink. The full solution comes only on an explicit request.
6. **Ask.** The chat column takes typed questions (`chat.text`) and spoken ones; both go through the same answer
   path and the reply is anchored to the line being discussed. Write something first: the tutor answers about the
   lines on the page.
7. **Voice.** Talk turns on local speech recognition and synthesis; the student can interrupt the tutor at any time.

Full design: [docs/spec/design.md](docs/spec/design.md).

## Run it for a class (operator guide)

Reference machine: Apple-silicon Mac, 32 GB or more of memory, 40 GB free disk. One Mac can serve several iPads.

**With internet, once:**
1. Install [uv](https://docs.astral.sh/uv/) and Node.js, then run the [Quick start](#quick-start) commands up to
   `make models`.

**Every session:**
1. Close memory-heavy apps, so Gemma 4 loads fully in memory. The server log line
   `tier 2 ready: gemma4-26b-a4b (full)` means full speed; `offload` means it runs from the SSD and answers slower.
2. Run `make ipad` in `tutor-app/` and keep that terminal open. It prints two ways in:
   - **HTTPS link and QR code (Cloudflare tunnel):** microphone works on the iPad; needs internet for the tunnel only.
   - **Same Wi-Fi (`http://<mac>.local:8000`):** works with no internet at all; Safari blocks the microphone over
     plain HTTP, so pen, chat and photos work but voice doesn't.
3. Each iPad scans the QR code (or the Mac shows it under **Pair iPad**). Old QR codes stop working when the
   server restarts with a new token.
4. Teachers open <http://localhost:8000/teacher> on the Mac for homework links and progress.

**If something goes wrong:** "HTTP 403" means the QR code belongs to an older run: scan the current one. "Voice
didn't start" usually means the voice packages are missing: run `uv sync` again in `tutor-app/`.

## What expertise is inside, and where it comes from

The model doesn't decide on its own whether a step is right. Most of the teaching is in code and written rules:

- **Checkers** (`tutor-app/apps/server/src/inktutor_server/checkers/`): [sympy](https://www.sympy.org) for algebra and
  calculus steps, arithmetic, double-entry ledger balances for accounting, sudoku rules and graph rules for diagrams.
  A ✗ backed by a checker is a fact, not the model's opinion.
- **How a teacher marks a page** (`ink-tutor/docs/UX.md`): marks are small and anchored to the line they're about. The
  student's ink is never changed. Correct steps get a ✓ and nothing else.
- **Hint ladder:** nudge → rule → the corrected step as "ghost ink" → the full solution, and that last step only if
  the student asks for it explicitly. The prompts are in `tutor-app/apps/server/src/inktutor_server/tutor/prompts/`.
- **Subject modes** (`tutor-app/modes/`): maths, accounting, language, sudoku, consulting cases and system design,
  each with its own rubric and prompt.
- **Test pages:** real Apple Pencil recordings of handwritten work, plus synthetic accounting and sudoku pages,
  annotated with what a good tutor should do at each checkpoint (`ink-tutor/fixtures/`).

## Models

All of them run locally through [MLX](https://github.com/ml-explore/mlx). Exact repos and revisions are pinned in
`ink-tutor/models/manifest.toml`; the choice of default is [ADR-0004](docs/adr/0004-use-gemma-4-26b-a4b-as-the-default-tutor.md).

| Role | Model | License |
|---|---|---|
| Tutor (default) | [Gemma 4 26B-A4B-it](https://huggingface.co/google/gemma-4-26B-A4B-it), QAT 4-bit ([MLX](https://huggingface.co/mlx-community/gemma-4-26B-A4B-it-qat-4bit)) | [Apache-2.0](https://ai.google.dev/gemma/docs/gemma_4_license) |
| Tutor (alternatives) | [Qwen3.6-35B-A3B](https://huggingface.co/Qwen/Qwen3.6-35B-A3B), [Qwen3.8-27B](https://huggingface.co/Qwen/Qwen3.8-27B) | Apache-2.0 |
| Reading handwriting and maths | [Qwen3.5-4B](https://huggingface.co/Qwen/Qwen3.5-4B) | [Apache-2.0](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/LICENSE) |
| Reading photos of paper | [Chandra OCR 2](https://huggingface.co/datalab-to/chandra-ocr-2) | [OpenRAIL (modified)](https://huggingface.co/datalab-to/chandra-ocr-2/blob/main/LICENSE): has use restrictions, read before reusing |
| Speech to text | [Parakeet TDT 0.6B v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3); [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo) for other languages | CC-BY-4.0; MIT |
| Text to speech | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) | Apache-2.0 |
| Voice activity | [Silero VAD](https://github.com/snakers4/silero-vad) | MIT |

[mathnote-ocr](https://github.com/YonatanNemtsov/mathnote-ocr) (Apache-2.0) is an optional, experimental stroke-based
maths reader (`math` extra). It isn't used by default.

## Proof that it works better with our part

We compare the same model (Gemma 4 26B-A4B, local) on the same handwritten page in two ways. **Without Open Tutor**,
it gets an image of the page and "check my work". **With Open Tutor**, it gets the full pipeline: reading, checkers,
marking rules and the hint ladder. The page is a real Apple Pencil recording of integrals, replayed stroke by stroke
and paused at 4 checkpoints: 2 correct steps and 2 mistakes.

| | Gemma 4 alone | Gemma 4 + Open Tutor |
|---|---|---|
| Behaves like a good tutor (same LLM judge, same expected behaviour) | 1/4 | 4/4 in the latest run; 15/16 over 4 runs |
| Finds the actual wrong step (2 mistake checkpoints) | 0/2: called the wrong integral correct and the correct quotient wrong | 2/2, decided by sympy |
| Marks the exact line on the page | no: a block of text about the whole page | 16/16 checkpoints scored by code (4 runs) |
| Gives away the solution unprompted | 3 of 4 checkpoints | never; only on explicit request |
| Time to first feedback | first words 1.6–2.6 s, full reply 7–14 s | first mark 2.6 s (latest run's median), 2.6–5.3 s across runs |

At the second checkpoint, plain Gemma 4 said: *"Your work for the second integral is correct, but there is a
calculation error in the first integral."* The opposite was true.

Reproduce it from `tutor-app/` with `make judge MODEL=gemma4-26b-a4b` (with Open Tutor) and
`uv run python -m inktutor_server.eval.baseline` (Gemma 4 alone). Reports are written to `tutor-app/.data/judge/`.
This is a small test: one page, four checkpoints, maths only, and the judge is itself a language model. It shows the
approach works; it isn't a study.

## Errors, limits and disclaimer

- **Model errors:** if a cloud provider fails, the same request goes to the local model and the page says
  "<provider> unavailable — answering locally". Local failures show a plain error in the page status; new ink
  cancels a slow review.
- **Limits on the public link:** the tunnel is gated by the pairing token, and only one tutor call per page runs at a
  time. That is the access control for one Mac serving one class, so no per-request rate limit is added; share the
  QR code only with your students.
- **Where it doesn't work yet:**
  - It needs an Apple-silicon Mac: the tutor model takes about 16 GB of memory and runs slower from the SSD when less
    is free. Realistic as one machine per school or community hub, not one per student. No phones yet.
  - The models are a large one-time download (30–40 GB).
  - The evidence above is small, and it hasn't been tested with students yet.
  - A typed question on an empty page gets no answer; write a line first.
  - Speech recognition covers 25 European languages with Parakeet; other languages use Whisper, loaded on demand.
  - The screen tutor for software is early work.
- **Disclaimer:** Open Tutor is a learning aid and can be wrong. It gives no legal, tax, medical or financial advice;
  every screen says "AI can make mistakes — check with your teacher".

## Documentation

The project is spec-driven:

| Folder | What's in it |
|---|---|
| [docs/spec/](docs/spec/) | [product](docs/spec/product.md), [requirements](docs/spec/requirements.md) (REQ/NFR with acceptance criteria), [design](docs/spec/design.md), [tasks](docs/spec/tasks.md), [progress](docs/spec/progress.md) |
| [docs/adr/](docs/adr/README.md) | 14 architecture decision records |
| [docs/hackathon/](docs/hackathon/CHECKLIST.md) | The organisers' checklist with evidence |
| [ink-tutor/docs/](ink-tutor/docs/) | The original design notes: architecture, UX rules, decisions log, models, roadmap, screen tutor |
| [media/](media/) | Architecture diagram and screenshots |

## Develop

```sh
cd tutor-app
make dev          # server with reload on :8000 + Vite on :5173
make test         # pytest (server, protocol, fixture replays) + vitest
make lint         # ruff + mypy --strict (protocol, agent) + eslint + tsc
make e2e          # Playwright: draw a fixture into the canvas
make protocol     # after changing packages/protocol: schema.json + TypeScript types
make judge MODEL=gemma4-26b-a4b
```

Layout: `tutor-app/` is the app (FastAPI server, React canvas in `apps/web`, the shared protocol in
`packages/protocol`, subject modes in `modes/`, the macOS overlay in `apps/overlay`); `ink-tutor/` holds the design
notes, the model manifest and downloader, the fixtures and the recorder.

## Contributing

Pick a task in [docs/spec/tasks.md](docs/spec/tasks.md), keep one task per pull request, and run before pushing:

```sh
cd tutor-app && make lint && make test
```

Record significant design choices as a new file in [docs/adr/](docs/adr/README.md), and update
[docs/spec/progress.md](docs/spec/progress.md) when a task is done.

## Open-source libraries

Server (Python, pinned in `tutor-app/uv.lock`):
- [MLX](https://github.com/ml-explore/mlx), [mlx-vlm](https://github.com/Blaizzy/mlx-vlm) and
  [mlx-audio](https://github.com/Blaizzy/mlx-audio) (MIT)
- [FastAPI](https://fastapi.tiangolo.com) (MIT), [Uvicorn](https://www.uvicorn.org) (BSD-3)
- [Pydantic](https://docs.pydantic.dev) (MIT), [HTTPX](https://www.python-httpx.org) (BSD-3)
- [SymPy](https://www.sympy.org) (BSD-3), [ANTLR runtime](https://www.antlr.org) (BSD-3)
- [NumPy](https://numpy.org) (BSD-3), [Pillow](https://python-pillow.org) (MIT-CMU)
- [segno](https://github.com/heuer/segno) (BSD-3), [zeroconf](https://github.com/python-zeroconf/python-zeroconf) (LGPL-2.1)
- Voice: [Silero VAD](https://github.com/snakers4/silero-vad) (MIT) with [ONNX Runtime](https://onnxruntime.ai) (MIT),
  [misaki](https://github.com/hexgrad/misaki) (Apache-2.0), [spaCy](https://spacy.io) and `en_core_web_sm` (MIT),
  [espeakng-loader](https://github.com/thewh1teagle/espeakng-loader) (MIT)
- the optional cloud SDKs: [anthropic](https://github.com/anthropics/anthropic-sdk-python) and
  [openai](https://github.com/openai/openai-python) (MIT)

Web (pinned in `tutor-app/apps/web/package.json` and `package-lock.json`):
- [React](https://react.dev) (MIT), [KaTeX](https://katex.org) (MIT)
- the [Caveat](https://fontsource.org/fonts/caveat) font (OFL-1.1)
- the [DM Sans](https://github.com/googlefonts/dm-fonts) font (OFL-1.1) and the start-screen design from
  [OpenTutor](https://github.com/adricasi/OpenTutor) (MIT); see `tutor-app/apps/web/THIRD_PARTY_LICENSES.md`
- [Vite](https://vite.dev), [Vitest](https://vitest.dev), [Playwright](https://playwright.dev), TypeScript and ESLint,
  for development

The iPad pairing uses [cloudflared](https://github.com/cloudflare/cloudflared) (Apache-2.0) for an HTTPS quick tunnel.

## Team

Arnau Mias, Adrià and Laura.

## License

[Apache-2.0](LICENSE). The models keep their own licences (see [Models](#models)).

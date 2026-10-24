# 0002. Run everything on one Apple-silicon Mac, local-first

- Status: Accepted
- Date: 2026-10-23
- Deciders: Open Tutor maintainers
- Source: DECISIONS #1, #2, #4 (and ARCHITECTURE §1)

## Context
The tutor is for students who cannot count on the internet or on school being open. It must
read handwriting, check steps and talk back with no network after a one-time model download.
There is no Apple developer account, so no native iOS app. One Mac per home, school or
community hub can serve one or a few tablets.

## Options considered
1. **Cloud recognition and tutoring (e.g. MyScript iink, a frontier API)** — Pros: best
   recognition quality, no local hardware. Cons: needs a connection, metered, the student's work
   leaves the device.
2. **Native iPad app running models on the tablet** — Pros: lowest pen latency. Cons: needs a
   developer account; an iPad cannot hold a tutor-sized model.
3. **One Apple-silicon Mac runs every model; the iPad is a browser (Safari + Apple Pencil)** —
   Pros: works offline, the work stays on the Mac, no account needed. Cons: needs a Mac with
   enough memory; one-time 30–40 GB download.

## Decision
We use option 3. The server (FastAPI) and every model run on the Mac; the iPad and the Mac's own
browser are thin web clients over a WebSocket. Recognition never leaves the Mac. The pipeline has
two tiers: tier 1 reads handwriting locally (Qwen3.5-4B per region, DECISIONS #17), tier 2 tutors
(ADR-0003, ADR-0004). A cloud provider is an explicit, per-session option for tier 2 only
(ADR-0011).

## Consequences
- Positive: fully offline after setup; privacy by default; one machine can serve a hub.
- Negative: an Apple-silicon Mac with ~22 GB free is the realistic minimum; no phone-only path.
- The iPad never runs models; Pencil input arrives as pointer events (pressure, tilt).

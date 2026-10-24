# 0007. Share a pydantic protocol with the TypeScript web app

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #13, #31 (and ARCHITECTURE §2, CHANGELOG Phase 1)

## Context
The Python server and the React canvas exchange many message types over WebSockets (ink updates,
readings, feedback, voice audio, screen-tutor events). Hand-kept duplicates in two languages drift.

## Options considered
1. **Hand-written types on both sides** — Cons: drift, silent wire bugs.
2. **A separate IDL (protobuf, etc.)** — Cons: another toolchain; JSON is already the wire format.
3. **pydantic models as the single source; JSON Schema export; TypeScript generated from it** —
   Pros: one definition, validation on the server, typed client. Cons: a generate step.

## Decision
We use option 3. [`tutor-app/packages/protocol`](../../tutor-app/packages/protocol/) holds the
pydantic models (`models.py`, `recording.py`), exported to `schema.json` and generated into
`apps/web/src/protocol.gen.ts` (`make protocol`). Conventions: dotted `type` literals, binary data
as base64 fields (`pcm16_b64`, `jpeg_b64`), coordinates in a shared `BBox`. The Swift overlay is
checked against the same `schema.json` by a server-side contract test (DECISIONS #32).

## Consequences
- Positive: one place to change the wire; a snapshot test catches unintended schema changes.
- Negative: the generated file must be regenerated and committed with every protocol change.

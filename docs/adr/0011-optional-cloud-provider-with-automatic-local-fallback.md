# 0011. An optional cloud provider for the tutoring step, with automatic local fallback

- Status: Accepted
- Date: 2026-10-23
- Deciders: Open Tutor maintainers
- Source: DECISIONS #2 (scope limited by #27, #32, #33)

## Context
Where a connection is available, a frontier model may give better explanations. The product must
still work offline, and the student's handwriting must not leave the Mac by default.

## Options considered
1. **Local only** — Cons: no way to use a stronger model when one is available.
2. **Cloud by default** — Cons: breaks the offline mission and privacy.
3. **Local by default; a per-session toggle sends only the tier-2 tutoring request to Anthropic or
   OpenAI; on failure, answer locally** — Pros: opt-in, bounded data, never stuck. Cons: two
   provider paths to maintain.

## Decision
We use option 3. `TUTOR_PROVIDER` defaults to `local`; keys go only in `tutor-app/.env`
(git-ignored; template in `.env.example`). Recognition, checkers, voice, the screen tutor and
teacher summaries (unless the teacher asks explicitly) stay local. If a cloud call fails, the agent
falls back to the local model and the page shows "<provider> unavailable — answering locally"
([`agent/agent.py`](../../tutor-app/apps/server/src/inktutor_server/agent/agent.py)).

## Consequences
- Positive: a cloud outage or a missing key never leaves the student without an answer.
- Negative: with the toggle on, the tutoring request (page context, crops, transcript) leaves the
  Mac; the UI shows the provider in use.

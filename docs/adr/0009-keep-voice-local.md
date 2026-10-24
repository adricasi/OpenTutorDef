# 0009. Keep voice local: Silero VAD, Parakeet, Kokoro

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #8, #20, #21, #27, #28, #29

## Context
Students should be able to ask out loud and hear the tutor, offline. Voice shares the Mac's
memory and GPU with the tutor model, and latency matters (target: speech end to first audio
< 1.5 s, ARCHITECTURE §9).

## Options considered
1. **Cloud realtime speech** — Pros: low latency, many languages. Cons: needs a connection; the
   student's voice leaves the Mac.
2. **A local stack: Silero VAD → Parakeet TDT (Whisper for other languages) → tier-2 tutor →
   Kokoro TTS** — Pros: offline, private. Cons: shares the GPU with reviews; Kokoro needs espeak-ng
   for out-of-lexicon words.
3. **Let the small tier-1 model answer spoken questions** — tried; not faster in practice
   (1.4–1.7 s vs 1.0 s warm) and it broke the hint ladder.

## Decision
We use option 2, also when a session's cloud toggle is on: voice is not sent to a cloud provider to
win latency. Spoken answers stream sentence by sentence; the student's voice pauses the tier-2
review, which resumes after the turn. When the VAD hears speech start, the agent prefills the
converse prompt on the local model so the prefix cache is warm. Kokoro uses the system espeak-ng
(the one approved Homebrew install) and falls back to English-only without it.

## Consequences
- Positive: voice works offline and stays on the Mac.
- Negative: Parakeet covers 25 European languages; other languages load Whisper on demand.
- The iPad microphone needs HTTPS, which drives the tunnel pairing (ADR-0010).

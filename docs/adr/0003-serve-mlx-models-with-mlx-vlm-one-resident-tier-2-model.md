# 0003. Serve MLX models with mlx-vlm, one tier-2 model resident at a time, offload under memory pressure

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #10, #18 (and ARCHITECTURE §4.3, MODELS.md)

## Context
The tutor model (tens of GB at 4-bit) shares the Mac's memory with the tier-1 reader, the voice
models and the photo reader, inside a 32 GB budget on a 36 GB machine. Which tutor model is best
was not known in advance and had to be compared on the owner's fixtures.

## Options considered
1. **Hard-code one tutor model** — Pros: simplest. Cons: no way to compare or switch models.
2. **Keep several tutor models loaded** — Pros: instant switch. Cons: does not fit in memory.
3. **A config key plus a UI picker; a supervised mlx-vlm server with one tier-2 model at a time;
   expert offload from the SSD when memory is short** — Pros: models are comparable
   (`make judge MODEL=…`), memory stays bounded. Cons: a swap takes ~10–40 s; offloaded mode is
   slower.

## Decision
We use option 3. `LOCAL_MODEL` selects a `[tier2.*]` entry in
[`ink-tutor/models/manifest.toml`](../../ink-tutor/models/manifest.toml) (repo and commit sha
pinned). The server's `runtime/` starts and supervises `mlx-vlm` (OpenAI-compatible endpoint),
stops it, frees memory and checks the budget before a swap; only one tier-2 model is ever resident.
Memory policy: load the full model only with 6 GiB headroom, else load it from its expert-offload
store with the largest cache that fits, else refuse; a watchdog downgrades a full model to offload
under pressure.

## Consequences
- Positive: adding a model is a manifest entry; the tutor degrades (slower text) instead of
  crashing; checker marks are the same in either mode.
- Negative: offloaded runs take ~6 s to first token and 30–45 s per review (MODELS.md).
- Tier-2 calls from the canvas, voice, screen tutor and teacher summaries share one model server,
  so they pause or yield to each other (DECISIONS #21, #33, #34).

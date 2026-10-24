# Architecture decision records

Significant architectural decisions for Open Tutor, in MADR style. Each ADR cites its source in
[`ink-tutor/docs/DECISIONS.md`](../../ink-tutor/docs/DECISIONS.md), which remains the full,
append-only log.

| # | Title | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-run-everything-on-one-apple-silicon-mac.md) | Run everything on one Apple-silicon Mac, local-first | Accepted |
| [0003](0003-serve-mlx-models-with-mlx-vlm-one-resident-tier-2-model.md) | Serve MLX models with mlx-vlm, one tier-2 model resident at a time, offload under memory pressure | Accepted |
| [0004](0004-use-gemma-4-26b-a4b-as-the-default-tutor.md) | Use Gemma 4 26B-A4B as the default tutor | Accepted |
| [0005](0005-deterministic-checkers-decide-the-model-only-explains.md) | Deterministic checkers decide right or wrong; the model only explains | Accepted |
| [0006](0006-hint-ladder-with-full-solution-only-on-request.md) | A hint ladder, with the full solution only on explicit request | Accepted |
| [0007](0007-share-a-pydantic-protocol-with-the-typescript-web-app.md) | Share a pydantic protocol with the TypeScript web app | Accepted |
| [0008](0008-store-sessions-and-progress-in-sqlite.md) | Store sessions and progress in SQLite on the Mac | Accepted |
| [0009](0009-keep-voice-local.md) | Keep voice local: Silero VAD, Parakeet, Kokoro | Accepted |
| [0010](0010-pair-the-ipad-through-a-token-gated-cloudflare-quick-tunnel.md) | Pair the iPad through a token-gated Cloudflare quick tunnel; LAN stays open | Accepted |
| [0011](0011-optional-cloud-provider-with-automatic-local-fallback.md) | An optional cloud provider for the tutoring step, with automatic local fallback | Accepted |
| [0012](0012-teacher-view-on-the-mac.md) | A teacher view on the Mac: homework, a learning log and a short summary | Accepted |
| [0013](0013-screen-tutor-overlay-points-never-acts.md) | A screen-tutor overlay that points and never acts | Accepted |
| [0014](0014-keep-ink-as-ink-on-a-hand-rolled-canvas.md) | Keep the student's ink as ink, on a hand-rolled canvas | Accepted |

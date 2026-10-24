# 0013. A screen-tutor overlay that points and never acts

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #30, #31, #32, #34 (and SCREEN-TUTOR.md)

## Context
The same tutor should walk people through desktop software (for example Excel) step by step. A
browser cannot draw over other apps or read their accessibility tree, and there is no Xcode.app or
developer account on the build Mac.

## Options considered
1. **Browser-only overlay** — Cons: cannot draw over other apps or read the AX tree.
2. **Automation-first (click and type for the user)** — Cons: does the task instead of teaching
   it; risky.
3. **Python + PyObjC helper** — Cons: not in the lockfile; a second runtime.
4. **A native Swift/AppKit helper that highlights, draws arrows and speaks steps, and detects
   completion from state** — Pros: works over any app; the user does every action. Cons: one
   native exception to web-only; macOS re-asks permissions after an ad-hoc rebuild.

## Decision
We use option 4. `tutor-app/apps/overlay` (SwiftPM, ad-hoc signed, run locally; logic in
`OverlayCore`, checked by `make overlay-test`) talks to `/ws/screen/{id}`, localhost only, so screen
data never goes through the tunnel. It points, it never acts (`ALLOW_AUTOMATION=false`). Targets
are located from the accessibility tree first, the VLM only on changed frames; completion is
state-based. Windows of apps in `SCREEN_BLOCKLIST` are skipped before capture. Screen mode is
local-only (no cloud toggle) and Gemma 4 plans and locates.

## Consequences
- Positive: teaches the task rather than doing it; screen data stays on the Mac.
- Negative: macOS only; live accuracy with Gemma is unmeasured; the feature is early work.

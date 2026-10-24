# 0014. Keep the student's ink as ink, on a hand-rolled canvas

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #3, #6, #15, #16

## Context
Handwriting is the point of the product: the tutor marks a page the way a teacher would. The
canvas must take Apple Pencil input in Safari over the LAN or the tunnel, and draw the tutor's
marks next to the student's lines.

## Options considered
1. **tldraw SDK** — Pros: rich editor API. Cons: since 4.0 a licence key is needed off localhost;
   its editing tools are unused because student ink is never edited.
2. **Excalidraw (MIT)** — Pros: open licence. Cons: same unused editing surface.
3. **Hand-rolled: 2D canvas for ink, an SVG tutor layer, HTML popovers** — Pros: already proven on
   the owner's iPad by the recorder; no licence key. Cons: own code to maintain.

## Decision
We use option 3 (DECISIONS #6's allowed fallback). The tutor never modifies, snaps or typesets the
student's strokes; it annotates on separate layers. A line is graded only once it settles (2.5 s
pen-up idle, or the pen starts another line), and its marks are retracted when it changes.

## Consequences
- Positive: no licence key; full control over Pencil handling and mark placement.
- Negative: diagram features such as Mermaid-to-shapes are not available out of the box.

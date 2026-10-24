# 0005. Deterministic checkers decide right or wrong; the model only explains

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #5, #19, #24

## Context
A language model judging a maths step can be confidently wrong. The project's baseline shows
plain Gemma 4 calling a wrong integral correct and a correct quotient wrong (README, "Does it work
better with our part?"). A wrong ✗ or ✓ teaches wrong maths.

## Options considered
1. **Model verdict only** — Pros: one path for every subject. Cons: verdict accuracy is the
   model's.
2. **Model verdict with a checker as a second opinion** — Pros: simple merge. Cons: wrong verdicts
   still reach the page when they disagree.
3. **Checkers run first and own the marks they can decide; the model words explanations and
   hints within those verdicts** — Pros: exact, testable verdicts. Cons: a checker per domain.

## Decision
We use option 3. Checkers in
[`checkers/`](../../tutor-app/apps/server/src/inktutor_server/checkers/) (sympy for algebra and
calculus, arithmetic including long division, double-entry ledgers and T-accounts, sudoku rules,
graph rules for diagrams) run before the LLM. On lines a checker decides, the checker owns the
✓/✗; the tutor adds speech, explanations and hint wording and may ask, never contradict. Lines no
checker can decide may be marked by the tutor, as "?" rather than "✗" in maths. Every feedback event
about a line is retracted when the line changes or is erased. In sudoku, only rule conflicts are
crossed unprompted (a ✗ for "contradicts the unique solution" would give the answer away).

## Consequences
- Positive: a ✗ backed by a checker is a fact; checker logic is unit-tested; 2/2 mistakes found in
  the baseline comparison against 0/2 for the model alone.
- Negative: only domains with a checker get exact verdicts; free-text modes stay model-judged.
- The teacher view's counts come from checker verdicts (ADR-0012).

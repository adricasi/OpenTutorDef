# 0006. A hint ladder, with the full solution only on explicit request

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #19, #24 (voice controls the ladder: #8, #28)

## Context
A tutor that gives the answer away stops the student from learning. In the baseline comparison,
plain Gemma 4 gave the solution away unprompted at 3 of 4 checkpoints (README).

## Options considered
1. **Answer whatever the model decides to say** — Cons: leaks solutions.
2. **No help beyond ✓/✗** — Cons: a stuck student stays stuck.
3. **A graded ladder the student climbs** — Pros: the least help that unblocks; the solution is a
   deliberate choice. Cons: more state per line.

## Decision
We use option 3: level 1 a nudge, level 2 the rule, level 3 the corrected step as ghost ink (for
checkable lines, the checker's exact corrected step), level 4 the full solution, only on an
explicit request. Levels 1–2 are the tutor's wording (the checker's if no tutor is available).
Speech can climb the ladder ("hint", "more"). Prompts are in
[`tutor/prompts/`](../../tutor-app/apps/server/src/inktutor_server/tutor/prompts/).

## Consequences
- Positive: the solution never appears unprompted; hint use per level feeds the learning log.
- Negative: a cheaper model answering voice questions broke the ladder in testing, which is one
  reason spoken questions stay with the tier-2 tutor (DECISIONS #28).

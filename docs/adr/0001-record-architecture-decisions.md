# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers

## Context
Open Tutor's decisions are logged as a numbered, append-only list in
[`ink-tutor/docs/DECISIONS.md`](../../ink-tutor/docs/DECISIONS.md) (decision, why, alternatives
rejected, date). That log is complete but terse, and the architectural decisions are mixed with
tooling and fixture choices. Reviewers and new contributors need the significant ones in a form
that states the context, the options and the consequences.

## Decision
We record Architecture Decision Records in `docs/adr/`, numbered sequentially, in MADR style
(Status, Date, Deciders; Context, Options considered, Decision, Consequences). Each ADR cites
the DECISIONS.md number(s) it comes from ("Source: DECISIONS #n"). DECISIONS.md stays the source
of truth; an ADR never contradicts it. Accepted ADRs are not rewritten; a new ADR supersedes an
old one and both are linked.

## Consequences
- The significant decisions and their trade-offs are discoverable next to the code.
- Two records must be kept in step: a new architectural entry in DECISIONS.md gets an ADR.
- The index is [README.md](README.md).

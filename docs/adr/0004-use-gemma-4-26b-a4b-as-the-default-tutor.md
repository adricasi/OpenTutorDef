# 0004. Use Gemma 4 26B-A4B as the default tutor

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #25 (amends #4, #10, #18)

## Context
The first design named Qwen3.6-35B-A3B as the tier-2 tutor (DECISIONS #4) and left the final
default to the fixture judge (#10). On the owner's 36 GB Mac, Qwen3.6 usually had to run
expert-offloaded (~6 s to first token), while Gemma 4 26B-A4B (~3.8B active parameters, ~15 GB at
4-bit) fits fully resident (MODELS.md).

## Options considered
1. **Qwen3.6-35B-A3B** — Pros: stronger handwriting benchmarks. Cons: offloaded on the target
   Mac, slow first token.
2. **Gemma 4 26B-A4B (QAT 4-bit, MLX)** — Pros: fully resident (first token ~1 s, ~43 tok/s),
   judge 100 % on the maths fixture and 1/1 on consulting, Apache-2.0. Cons: fewer handwriting
   benchmarks published.
3. **Qwen3.8-27B (dense)** — Pros: strong. Cons: dense, slower per token.

## Decision
We use option 2 as the default (`LOCAL_MODEL=gemma4-26b-a4b`). Qwen3.6 and Qwen3.8 stay registered
and selectable (ADR-0003). Gemma 4 also plans and locates in the screen tutor (DECISIONS #31).

## Consequences
- Positive: low latency for marks and voice; more memory headroom for voice and photo reading.
- Negative: the evidence is small (one maths page, one consulting case); the choice is revisited
  as more fixtures are judged.

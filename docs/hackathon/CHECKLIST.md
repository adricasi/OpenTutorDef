# Hackathon minimum standard: where each item is met

Checklist shown at the hackathon ("The minimum standard"). Each line points to the evidence in
this repository. Items marked **Open** or **to verify** are not confirmed yet.

## In the repo
| Item | Status | Evidence |
|---|---|---|
| An open-source LICENSE | Done | [LICENSE](../../LICENSE) (Apache-2.0). The models keep their own licences (README, "Models"). |
| Keys only in `.env`, and `.env` in `.gitignore` | Done | The default local provider needs no key. Optional cloud keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are read from `tutor-app/.env`; [`tutor-app/.gitignore`](../../tutor-app/.gitignore) excludes `.env`, and [`tutor-app/.env.example`](../../tutor-app/.env.example) has empty values. No secret scanner runs in CI. |
| No real personal data in tests or examples | Done (spot-checked) | Tests use invented first names only (teacher-view tests); no email addresses found in tests, web sources or fixtures. Fixtures are Apple Pencil strokes of maths work plus synthetic accounting/sudoku pages (`ink-tutor/tools/synthetic/`). The owner's raw recordings, photos and screen fixtures are git-ignored ([.gitignore](../../.gitignore)). The teacher log stores no strokes or images (ADR-0012). |
| Pinned dependencies | Done | Python: [`tutor-app/uv.lock`](../../tutor-app/uv.lock). Web: [`tutor-app/apps/web/package-lock.json`](../../tutor-app/apps/web/package-lock.json) (`npm ci`). Models: repo + commit sha per entry in [`ink-tutor/models/manifest.toml`](../../ink-tutor/models/manifest.toml). |
| No critical vulnerabilities | Done | Checked 2026-10-24. Python: `pip-audit` 2.9.0 on the 173 locked packages (`uv export --frozen --all-extras`): no known vulnerabilities (`en-core-web-sm` skipped because it is a URL wheel). Web: `npm audit --omit=dev`: 1 low-severity advisory (KaTeX), none high or critical. |
| A clear error when the model API fails | Done | If the cloud tutor fails, the agent answers with the local model and the page shows "<provider> unavailable — answering locally" ([`agent/agent.py`](../../tutor-app/apps/server/src/inktutor_server/agent/agent.py), tested in [`notices.test.tsx`](../../tutor-app/apps/web/src/notices.test.tsx)). Screen-tutor failures are a plain sentence with phase `error`, spoken when voice is on (DECISIONS #34). See ADR-0011. |
| A rate limit on a public demo | Partly | The only public surface is the Cloudflare quick tunnel, gated by a pairing token (QR `?k=…` → HttpOnly cookie) in [`pairing.py`](../../tutor-app/apps/server/src/inktutor_server/pairing.py); tokens can be rotated (`python -m inktutor_server.pair --new-token`). `/teacher` and the screen-tutor socket are refused through the tunnel (ADR-0010, ADR-0012, ADR-0013). **Open:** there is no per-request rate limit; anyone holding the token can send unlimited requests. |
| A disclaimer | Done | README "Disclaimer" (a learning aid that can be wrong; not financial, accounting or business advice). The UI shows "AI can make mistakes — check with your teacher" ([`StartFrame.tsx`](../../tutor-app/apps/web/src/ui/start/StartFrame.tsx), [`ChatPanel.tsx`](../../tutor-app/apps/web/src/ui/chat/ChatPanel.tsx)). |

## In the README
| Item | Status | Where |
|---|---|---|
| What it is and who it's for | Done | Top of [README](../../README.md) and "Who it's for" (students with poor connectivity or climate-closed schools; sources cited). |
| How to run it | Done | "How to run it": `./setup-local.sh`, `uv sync`, `npm ci`, `make models`, `make ipad`; offline on the Mac with `make build && make server`. |
| What expertise is inside, and where it comes from | Done | "What expertise is inside, and where it comes from": checkers (`checkers/`), marking rules (`ink-tutor/docs/UX.md`), the hint ladder (`tutor/prompts/`), subject modes (`tutor-app/modes/`), annotated test pages (`ink-tutor/fixtures/`). |
| The model and a link to its licence | Done | "Models": Gemma 4 26B-A4B-it (default tutor) with a link to the [Gemma 4 licence (Apache-2.0)](https://ai.google.dev/gemma/docs/gemma_4_license); every other model is listed with its licence link. |
| Proof that it works better with our part | Done (small) | "Does it work better with our part?": same model, same page, 4 checkpoints; with Open Tutor 4/4 in the latest run (15/16 over 4 runs) vs 1/4 alone; 2/2 mistakes found vs 0/2. Reproduce with `make judge MODEL=gemma4-26b-a4b` vs `uv run python -m inktutor_server.eval.baseline` ([`eval/baseline.py`](../../tutor-app/apps/server/src/inktutor_server/eval/baseline.py)). The JSON reports are written to `tutor-app/.data/judge/` on the machine that runs them (git-ignored, so not in the repository); the numbers come from the 2026-10-24 runs on an M3 Pro. One page, maths only, LLM judge. |

## Not covered by the checklist but useful for the demo
- Architecture decisions: [docs/adr/](../adr/README.md).
- Known limits: README "Where it doesn't work yet".

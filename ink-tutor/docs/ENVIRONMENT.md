# Environment (checked 2026-10-24)

## Machine

| item | found | needed | status |
|---|---|---|---|
| Mac | Apple M3 Pro, 12 cores, macOS 14.3 (23D56) | M3 Pro | ✓ |
| Memory | **36 GiB physical** (`hw.memsize` = 38.65 GB) | 32 GB budget | ✓ more than the docs assume; the 32 GB budget (non-negotiable 8) still applies |
| Free memory now | ~12–13 GiB available without pressure, ~16 GiB with compression; apps hold ~17 GiB (Firefox ~3.5 GB, VS Code ~3 GB, Claude, Finder/Spotlight); swap 0.8 GiB used | ~21 GiB for tier-2 + ~3 GiB tier-1 | ⚠ see below |
| Disk | 930 GB free | ~70 GB for all weights | ✓ |
| `uv` | 0.7.3 | uv | ✓ (old but works; `uv self update` is optional) |
| Node | v22.17.0 (nvm), npm, pnpm | Node 20+ | ✓ |
| Python 3.12 | 3.12.8 (python.org) and 3.12.10 (uv-managed) | 3.12 | ✓ uv uses 3.12.10 |
| Model server on :8080 | **nothing listening** | mlx-vlm / LM Studio | expected for now; started by `runtime/` in Phase 3 (`LOCAL_SERVER_MANAGED=true`) |
| ffmpeg / ffprobe | not on PATH | for `tools/video` | ✓ via the `static-ffmpeg` pip package (ffmpeg 7.0, arm64), declared inline in `extract_frames.py` |
| cloudflared | not on PATH | for `get_recordings` | ✓ pinned 2026.10.3, sha256-verified, downloaded to `.tools/bin/` on first run |
| Playwright browsers | Chromium headless shell 156 in `.tools/ms-playwright/` | Phase 2 e2e | ✓ Chromium. ✗ **WebKit crashes on macOS 14.3** (bus error at launch); see below |
| git | /usr/bin/git; repo initialised at the base folder | | ✓ |

### Memory: what it means for the tier-2 default

With today's apps open, roughly 12–16 GiB can be handed out before macOS starts compressing heavily. The tier-2 default `qwen36-35b-a3b` needs ~19 GiB of weights plus KV cache. Loading it as things stand would push the Mac into compression and swap. Gemma 4 26B-A4B QAT (~14.5 GiB) fits more comfortably.

The machine itself is big enough: 36 GiB total, so tier-2 21 + tier-1 2.5 + voice 2 + OS ~5 = ~30.5 GiB, as MODELS.md says. It just needs the browser and editor footprint kept small while the tier-2 model runs: Firefox with few tabs, or Safari. This is not a decision to change the default (that is `make judge`'s job, DECISIONS #10). `tools/sysmon.py --require <memory_gb>` runs before every model load, and `runtime/` will refuse to load when it fails.

### WebKit on macOS 14.3

Playwright's current WebKit build (`webkit_mac14_arm64_special-2251`) dies with SIGBUS on 14.3, inside and outside the sandbox. Browser tests use Chromium for now. Updating macOS to the latest 14.x or 15 would very likely enable WebKit tests, which are the closest thing to iPad Safari. That's your call, and nothing is blocked without it. Real iPad Safari remains the acceptance check for Phase 2.

## Where things live (nothing is written outside the repo)

| what | where | how |
|---|---|---|
| uv cache | `.cache/uv/` | base `uv.toml` (`cache-dir`, absolute; uv resolves relative paths against the cwd. **Update it if you move the repo.**) |
| model weights | `ink-tutor/models/weights/hf/` (git-ignored) | `HF_HOME`, set by `models/fetch.py` and `tools/video/extract_frames.py`; the server will set it too |
| tool binaries | `.tools/bin/` (cloudflared), `.tools/ms-playwright/` | `PLAYWRIGHT_BROWSERS_PATH` |
| logs | `.cache/models-fetch.log`, `.cache/sysmon.log` | |

Your existing `~/.cache/huggingface` (Kokoro, whisper-large-v3-turbo-asr-fp16, Qwen3.5-9B, …) is left untouched and not reused, so the repo stays self-contained. That costs about 2 GB of duplicate downloads.

## Models (exact Hugging Face repos, pinned in `models/manifest.toml`)

All repos exist, are public and ungated, and the tier-2/tier-1 vision models ship a `vision_config` + processor (checked via the HF API).

| key | repo | revision | disk | notes |
|---|---|---|---|---|
| tier2.qwen36-35b-a3b (default) | [mlx-community/Qwen3.6-35B-A3B-4bit](https://huggingface.co/mlx-community/Qwen3.6-35B-A3B-4bit) | `38740b8` | 20.4 GB | `qwen3_5_moe`; 4-bit with 8-bit router/shared-expert gates (≈ the "4.8-bit" in MODELS.md); most-downloaded MLX build. Alternatives: `-4.4bit-msq` (21.2 GB), `-5bit` (24.8 GB, too big with tier-1 + voice) |
| tier2.gemma4-26b-a4b | [mlx-community/gemma-4-26B-A4B-it-qat-4bit](https://huggingface.co/mlx-community/gemma-4-26B-A4B-it-qat-4bit) | `0e3cbab` | 15.6 GB | QAT weights (Google's quantization-aware training) beat post-hoc 4-bit at the same size; plain `gemma-4-26b-a4b-it-4bit` is the fallback |
| tier2.qwen38-27b | [mlx-community/Qwen3.8-27B-4bit](https://huggingface.co/mlx-community/Qwen3.8-27B-4bit) | `10c35ca` | 16.1 GB | dense; not downloaded yet (fetch on demand for the judge) |
| tier1.text | [mlx-community/Qwen3.5-4B-MLX-4bit](https://huggingface.co/mlx-community/Qwen3.5-4B-MLX-4bit) | `32f3e8e` | 3.1 GB | as in MODELS.md |
| tier1.photo | [lalalalalaa/chandra-ocr-2-mlx-mixed-4-8](https://huggingface.co/lalalalalaa/chandra-ocr-2-mlx-mixed-4-8) | `53c2e49` | 3.6 GB | community conversion named in MODELS.md. Official-org alternative: [mlx-community/chandra-ocr-2-oQ8](https://huggingface.co/mlx-community/chandra-ocr-2-oQ8) (8-bit, 5.2 GB); compare on photo fixtures in Phase 8 |
| tier1.math | `mathnote-ocr==0.2.1` (PyPI) | | tiny | stroke-based, CPU |
| voice.stt | [mlx-community/parakeet-tdt-0.6b-v3](https://huggingface.co/mlx-community/parakeet-tdt-0.6b-v3) | `ed2b7e8` | 2.5 GB | 25 European languages |
| voice.stt_fallback | [mlx-community/whisper-large-v3-turbo](https://huggingface.co/mlx-community/whisper-large-v3-turbo) | `a4aaeec` | 1.6 GB | also used for video transcripts |
| voice.tts | [mlx-community/Kokoro-82M-bf16](https://huggingface.co/mlx-community/Kokoro-82M-bf16) | `a71e4d3` | 0.4 GB | |
| voice.vad | `silero-vad` 6.2.3 (PyPI) | | tiny | |

Python packages for later phases (current PyPI): `mlx-vlm` 0.7.10, `mlx-audio` 0.6.1, `mlx-whisper` 0.4.3, `mathnote-ocr` 0.2.1. Whether `mlx-vlm` 0.7.10 loads `qwen3_5_moe` and `gemma4` gets verified in Phase 3 before anything depends on it.

### Download status

**Done 2026-10-24 ~08:45, all verified** (`--verify`: every file of the pinned revision present at full size, 47 GB): tier2.qwen36-35b-a3b, tier2.gemma4-26b-a4b, tier1.text, tier1.photo, voice.stt, voice.tts. Not yet fetched: tier2.qwen38-27b, voice.stt_fallback (on demand).

The first attempt used `hf_xet` with 8 workers. It ran at ~50 MB/s but grew to **5.2 GB RSS** while buffering chunks, dropping available memory to 7.9 GiB. `fetch.py` now sets `HF_HUB_DISABLE_XET=1` and uses 4 workers: ~22 MB/s at ~0.3 GB RSS. Slower, but it doesn't put pressure on the Mac.

```bash
tail -c 400 .cache/models-fetch.log | tr '\r' '\n' | tail -2   # progress
cd ink-tutor && uv run models/fetch.py --list                   # ● present / ○ missing
cd ink-tutor && uv run models/fetch.py --verify                 # every file of the pinned revision, by size
```

## What you need to do

Nothing is required. Optional:

1. Keep the browser/editor footprint small when running the 35B tier-2 model (see Memory above).
2. Optionally update macOS so Playwright WebKit (≈ Safari) tests can run.
3. Record fixtures: `get_recordings/get-recordings`, then scan the QR with the iPad.
4. Cloud keys only when you want the Phase 5 toggle: `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in `.env` (never committed).

.PHONY: recorder record dev models models-verify sysmon videos test lint judge
recorder:        ## serve the stroke recorder on :8765 and collect recordings into fixtures/
	python3 tools/recorder/collector.py
record:          ## recorder over a free Cloudflare tunnel + QR code; saves into ../recordings/
	../get_recordings/get-recordings
dev:             ## (to create) server + web + local model server
	@echo "not implemented yet — see docs/ROADMAP.md Phase 1"
models:          ## download the pinned MLX weights (LOCAL_MODEL + tier1 + voice) into models/weights/hf
	uv run models/fetch.py
models-verify:   ## check downloaded weights against the pinned revisions
	uv run models/fetch.py --verify
sysmon:          ## one-line memory/CPU check (use before loading models)
	python3 tools/sysmon.py
videos:          ## frames + contact sheets (+ audio) for everything in fixtures/videos/
	uv run tools/video/extract_frames.py
test:            ## (to create) pytest + vitest + fixture replays
	@echo "not implemented yet"
lint:            ## (to create) ruff + mypy + eslint + tsc
	@echo "not implemented yet"
judge:           ## (to create) run the fixture judge for a local model: make judge MODEL=gemma4-26b-a4b
	@echo "not implemented yet — see docs/ROADMAP.md Phase 3 (MODEL=$(MODEL))"

# ink-tutor: design, models and fixtures

The spec side of [Open Tutor](../README.md). The app itself is in `../tutor-app/`.

- `docs/`: start with `ARCHITECTURE.md`, then `UX.md` (how the tutor marks and hints), `DECISIONS.md`, `MODELS.md` and
  `ROADMAP.md`. `SCREEN-TUTOR.md` covers the software walkthrough mode.
- `models/`: `manifest.toml` pins every model (Hugging Face repo and revision, memory, licence notes). `fetch.py`
  downloads and verifies them (`make models` from `tutor-app/`).
- `fixtures/`: handwriting recordings (stroke by stroke, with timing) and their annotations, meaning what a good tutor
  should do at each checkpoint. They're replayed by the tests and by `make judge`.
- `tools/`: the recorder used to capture fixtures, a synthetic-page generator and a memory/CPU monitor (`sysmon.py`).

## Record new fixtures

```bash
python3 tools/recorder/collector.py
# open the printed http://<mac>.local:8765 on the iPad or Mac, record a session, End → Send to Mac
# the file appears in fixtures/recordings/; add the expected behaviour in fixtures/annotations/
```

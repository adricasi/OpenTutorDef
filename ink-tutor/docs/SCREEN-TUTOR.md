# Screen tutor (software walkthroughs on the Mac)

Status: agreed design (owner validated 2026-10-24). Phase 11 (overlay helper, `/ws/screen/{id}`) is built; the server side of Phases 12–13 (perception, voice over the screen socket, guide loop) is built and tested on a synthetic fixture, not yet run live with Gemma (see "Server side as built"). The helper's capture/AX reader is the other half of Phase 12. Second mode of the same product: instead of a canvas, the "page" is the user's Mac screen; instead of strokes, the input is screenshots plus the accessibility tree; instead of marks on ink, the output is highlights, arrows and captions drawn over any application. Same brain, same voice, same rules.

Merged from the owner's `screen-tutor-addition/` and adapted to the app as built in `tutor-app/` (DECISIONS #13). Adaptations are marked *(adapted: …)* and summarised in DECISIONS #31.

## The experience

1. The user asks, by voice (default) or text: "how do I make a pivot table of sales by region?"
2. A floating, draggable **phantom icon** sits on the screen. You just talk to it: listening starts when the helper connects. Clicking it opens a small menu: listen on/off, mute, show transcript, pause, exit.
3. The tutor plans the steps, then guides **one step at a time**: a highlight box around the control on the user's actual screen, an arrow if the target is far from the mouse, a short caption, and a short spoken line ("Click *Insert* in the ribbon").
4. **The user does the clicking.** The system watches the screen, detects that the step is done, and advances automatically. If the user does something else, it adapts (replans) rather than insisting.
5. Hint ladder applies: first the location, then why, then what the control does, then the full sequence — never doing it for the user (automation is a later flag, off by default).

Over any app: Excel, Numbers, Figma, Terminal, browser, system settings.

## Components

```
tutor-app/apps/overlay/  (macOS helper, Swift + AppKit, built with SwiftPM, ad-hoc signed, runs locally)
  ├─ Overlay window: transparent, click-through, above all apps and all displays; draws highlight/arrow/caption
  ├─ Phantom icon: draggable floating button + menu (listen on/off, mute, transcript, pause, exit)
  ├─ Capture: ScreenCaptureKit frames at ~1 fps, plus a frame on every click and on focused-window change; downscaled
  ├─ AX reader: Accessibility API snapshot of the frontmost app (windows, elements: role, title, value, frame, enabled, path)
  ├─ Input hooks: global click/keystroke *events only* (no content), to know when the user acted
  ├─ Voice I/O: mic → PCM16 16 kHz `voice.audio`; plays `voice.audio` back  (adapted: the browser does this for the
  │            canvas; VAD/STT/TTS stay in the server's voice/ stack)
  └─ Client of apps/server: ws://127.0.0.1:8000/ws/screen/{session_id}, messages from packages/protocol
               (adapted: own endpoint, localhost only; see "Networking")

tutor-app/apps/server/src/inktutor_server/
  ├─ screen/   frame ingestion, change detection (perceptual hash diff), region crops around targets
  ├─ ax/       AX snapshot model, element search (by role+title+path), predicates ("dialog titled X exists")
  ├─ guide/    planner (goal → ordered steps with target descriptors and done_when predicates), stepper state
  │            machine, replanner; GuideAgent = the screen variant of agent/
  └─ tutor/, voice/, runtime/, agent/  shared with the ink tutor

tutor-app/modes/screen/{config.toml,rubric.md}   the mode's knobs + rubric, like every subject  (adapted)
tutor-app/modes/apps/<app>.md                    optional recipes: known AX paths and step templates for common
                                                 tasks (Excel pivot table, …); not a subject (no config.toml)
tutor-app/apps/server/src/inktutor_server/tutor/prompts/screen.md   ## rules · ## plan · ## locate · ## converse
```

Permissions needed once (macOS prompts): Screen Recording, Accessibility, Microphone. No Apple developer account: the helper is built and run locally (ad-hoc signed). See "Setup notes".

## Data model additions (`packages/protocol`)

*(adapted: written in the style of `inktutor_protocol/models.py`: `_M` base (`extra="forbid"`), `BBox` reused, client messages carry a dotted `type` literal, server messages wrap their payload like `FeedbackMsg`; images travel as base64 strings because the wire is JSON over WebSocket, like `VoiceAudio.pcm16_b64` and the photo upload's `data_url`.)*

All screen-mode `BBox`es and points are **global display points** in AX coordinates (origin top-left of the main display, y down); the helper converts to AppKit coordinates for drawing. *(adapted: the addition left the coordinate space open; AX frames and VLM boxes must land in one space.)*

```python
Mode = Literal[..., "screen"]                                  # Session.mode; Session.pages stays empty
GuidePhase = Literal["idle", "planning", "locating", "guiding", "verifying", "replanning", "paused", "done"]

class Point2(_M): x: float; y: float

class AXElement(_M):
    id: str; role: str; title: str | None = None; value: str | None = None   # value never sent for secure fields
    frame: BBox; enabled: bool = True
    path: list[str] = []                                       # role/title chain from the window

# ---- wire: overlay → server
class AXSnapshot(_M):
    type: Literal["ax.snapshot"] = "ax.snapshot"
    app: str; window_title: str = ""; display: int = 0
    elements: list[AXElement] = []                             # visible elements only; empty while a secure field is focused
    focused_id: str | None = None; secure_field_focused: bool = False
    pointer: Point2 | None = None                              # cursor at snapshot time (adapted: for the 300 px arrow rule)
    t_ms: float

class ScreenFrame(_M):
    type: Literal["screen.frame"] = "screen.frame"
    id: str; display: int
    origin: Point2                                             # display's top-left in global points (adapted: maps VLM boxes)
    width: int; height: int; scale: float                      # JPEG px; JPEG px per point
    jpeg_b64: str                                              # adapted: was `jpeg: bytes`
    window: BBox | None = None                                 # frontmost window: the only crop the cloud ever gets
    t_ms: float; trigger: Literal["tick", "click", "focus"]

class InputEvent(_M):
    type: Literal["input.event"] = "input.event"
    kind: Literal["click", "key"]; t_ms: float
    at: Point2 | None = None                                   # click position; keys carry no content, not even key codes

class DisplayInfo(_M):  id: int; frame: BBox; scale: float = 1; main: bool = False   # Phase 11: frame in global points
class ScreenHello(_M):  type: Literal["screen.hello"] = "screen.hello"; helper: str = ""
                        displays: list[DisplayInfo] = []      # Phase 11: on connect + on display changes (see below)

class GuideGoal(_M):    type: Literal["guide.goal"] = "guide.goal"; text: str          # the spoken goal (1–500 chars)
class GuideControl(_M): type: Literal["guide.control"] = "guide.control"
                        action: Literal["next", "back", "repeat", "pause", "resume", "stop"]

ScreenClientMessage = Annotated[ScreenHello | ScreenFrame | AXSnapshot | InputEvent | GuideGoal | GuideControl
                                | SessionUpdate | VoiceAudio | VoiceStop, Field(discriminator="type")]

# ---- plan (server-internal + sent to the overlay's transcript panel)
class Target(_M):
    ax_path: list[str] | None = None; title_regex: str | None = None
    bbox: BBox | None = None
    source: Literal["ax", "vlm"] | None = None                 # adapted: None until located (the planner doesn't know yet)
class DoneWhen(_M):
    kind: Literal["ax_exists", "ax_value", "window_title", "vlm_yes_no", "user_next"]; args: dict[str, object] = {}
class GuideStep(_M):
    id: str; n: int; instruction: str; speak: str              # speak ≤ 15 words (code-enforced)
    target: Target | None = None; done_when: DoneWhen
    hint_levels: list[str] = []                                # rungs 1–3; rung 4 (full sequence) is the plan itself
class GuidePlan(_M): goal: str; app: str; steps: list[GuideStep]; version: int = 0

class OverlayEvent(_M):
    id: str                                                    # adapted: like FeedbackEvent.id, so `clear` can refer to it
    type: Literal["highlight", "arrow", "caption", "pulse", "clear", "phantom_state"]
    bbox: BBox | None = None; from_point: Point2 | None = None; text: str | None = None
    step_id: str | None = None; ttl_ms: int | None = None
    refers_to: str | None = None                               # Phase 11: clear/pulse target (like FeedbackEvent.refers_to)
    state: Literal["idle", "listening", "thinking", "speaking", "paused", "capture_paused"] | None = None  # phantom_state (adapted)

# ---- wire: server → overlay
class OverlayMsg(_M):      type: Literal["overlay"] = "overlay"; event: OverlayEvent; provider: str = ""; model: str = ""
class GuidePlanMsg(_M):    type: Literal["guide.plan"] = "guide.plan"; plan: GuidePlan
class GuideStatusMsg(_M):  type: Literal["guide.status"] = "guide.status"; phase: GuidePhase; step: int = 0; of: int = 0; detail: str = ""
class ScreenConfigMsg(_M): type: Literal["screen.config"] = "screen.config"; blocklist: list[str]; capture_fps: float = 1.0
                           allow_automation: bool = False      # adapted: the helper enforces the blocklist before capture

ScreenServerMessage = Annotated[OverlayMsg | GuidePlanMsg | GuideStatusMsg | ScreenConfigMsg | SessionMsg
                                | VoiceTranscript | VoiceAudioOut | ErrorMsg | RuntimeMsg, Field(discriminator="type")]
```

**Landed in Phase 11** (`inktutor_protocol/models.py`, DECISIONS #32): `Point2`, `OverlayEvent`, `DisplayInfo`, `ScreenHello`, `GuideGoal`, `GuideControl`, `OverlayMsg`, `ScreenConfigMsg`, with the unions as far as they go today: `ScreenClientMessage = ScreenHello | GuideGoal | GuideControl | SessionUpdate`, `ScreenServerMessage = OverlayMsg | ScreenConfigMsg | ErrorMsg`. The other types and union members join in Phases 12–13; `Mode` gains `"screen"` with the guide loop (Phase 13), when a screen session becomes a `Session`. Two additions to the design *(adapted)*:
- `screen.hello {helper, displays}`: the server needs the display layout to enforce "every highlight inside the display bounds" before any `ScreenFrame` exists, and later to map VLM boxes on displays it has no frame from yet.
- `OverlayEvent.refers_to`. Semantics, implemented by the helper's `OverlayStore`: an event with an id already drawn replaces it (and restarts its TTL); `clear` with `refers_to` removes that event, else with `step_id` everything of that step, else everything, and pulses on a cleared event go with it; `pulse` with `refers_to` and no `bbox` pulses that event's box (default TTL 2.4 s); `phantom_state` only changes the icon. The server refuses (422) a `highlight`/`arrow`/box-less `pulse` without a bbox, an `arrow` without `from_point`, an empty caption, a `phantom_state` without `state`, and any box or point outside every display of the helper's last hello.

Wire events *(adapted to the existing names)*: overlay → server: `screen.hello` (Phase 11: displays, on connect and on display changes), `screen.frame`, `ax.snapshot`, `input.event`, `guide.goal` (the spoken goal), `guide.control` (phantom pause/exit, voice next/back/repeat/stop), `session.update {voice, provider}` (phantom listen on/off, provider toggle), `voice.audio`, `voice.stop`. Server → overlay: `overlay {OverlayEvent}`, `guide.plan`, `guide.status {phase, step n/N}` (was `status`), `screen.config` (on connect), and the existing `session`, `voice.transcript`, `voice.audio`, `runtime`, `error`. There is no separate `speak` message *(adapted)*: a step's `speak` line goes out as a `caption` (the transcript panel's text) plus `voice.audio` whose `feedback_id` is that caption's id.

The helper's `Codable` structs mirror `schema.json` (`make protocol` exports both unions); a server test validates every message in `fixtures/screens/*.json` against the pydantic models, so the Swift side can't drift silently. *(Phase 11: `apps/server/tests/test_overlay_contract.py` parses `apps/overlay/Sources/OverlayCore/Protocol.swift` and checks every `// protocol:` struct's CodingKeys and every `// protocol-enum:` enum against `schema.json`; `apps/overlay/Fixtures/screen-messages.json` holds wire examples that the pytest validates with pydantic and `overlay-selftest` decodes/encodes in Swift.)*

## The guide loop (agent state machine, screen variant)

`idle → planning → locating → guiding → verifying → (next step | replanning) → done`, plus `paused` (phantom pause, secure field, blocklisted app). Each transition is a `guide.status`. *(adapted: the canvas agent's states — `idle → recognizing → checking → reviewing → waiting` — stay as they are; `guide/` reuses the same building blocks, listed below.)*

- **planning:** tier-2 with the goal, app name, window title, a downscaled screenshot and a compact AX summary → `GuidePlan` (JSON, validated). Recipes in `modes/apps/<app>.md` are prepended when the app matches; they make plans precise and cheap. *(adapted: the plan streams as JSON lines, one `{"type":"step",…}` per line, validated as it arrives like `FeedbackEvent`s, so step 1 can be located while the rest streams.)*
- **locating:** resolve `Target` with AX first (exact frame, exact name). Only if AX has no match (canvas-style apps, web content without roles) fall back to the VLM: send the screenshot, ask for the bbox of the described control (the step's `instruction`), snap to the nearest AX frame if one overlaps; VLM boxes come in JPEG pixels and are mapped to global points with the frame's `origin` and `scale`.
- **guiding:** emit `highlight` + `caption` + the spoken line; `arrow` from the pointer if the target is > 300 px away; `pulse` after 8 s of inactivity.
- **verifying:** evaluate `done_when` on every AX snapshot / frame (debounced 300 ms). `ax_exists` ("a sheet named PivotTable…" / "dialog titled Create PivotTable"), `ax_value` (a field now contains X), `window_title`; `vlm_yes_no` only as a fallback and only on frames that changed. On success: `clear`, advance. If the user's action led somewhere unexpected (focused app changed, a different dialog opened): `replanning` from the current state, keeping the goal; say so in one short line.
- **safety:** never emit a step that types into or reads a secure text field (AX `secure_field_focused` pauses capture and says "I'll wait"). Never click, type or scroll (automation is a later feature behind `ALLOW_AUTOMATION=false`; no overlay or wire message can act on the user's screen).

Rules in code, not prompt: one tier-2 call in flight per guide, and a newer screen state (focus change, unexpected dialog) cancels a `locate`/`verify` still in flight for the old one (the "new ink cancels" rule); `vlm_yes_no` no more than once per 2 s; plan length ≤ 15 steps (else split into sub-goals); every `highlight` must carry a bbox inside the display bounds; events naming a `step_id` outside the current plan are dropped (like unknown anchors); spoken lines ≤ 15 words unless the user asked a question. Knobs (300 px, 8 s, 300 ms, 2 s, 15 steps, capture fps) live in `modes/screen/config.toml`.

**What it reuses** *(adapted)*:
- **`Tutor` interface** (`tutor/base.py`): two new methods next to `review`/`hint`/`converse`, implemented by the same three providers (no new client):
  ```python
  def plan(self, ctx: PlanContext) -> AsyncIterator[dict[str, Any]]: ...      # JSON lines: {"type":"step", …}
  def locate(self, ctx: LocateContext) -> AsyncIterator[dict[str, Any]]: ...  # {"type":"bbox", …} or, for vlm_yes_no, {"type":"yes_no","yes":…}
  ```
  `PlanContext` / `LocateContext` are dataclasses like `ReviewContext` (JPEG bytes decoded from `jpeg_b64` at ingestion; AX summary as text; recipe; steps already done for a replan). Prompts in `tutor/prompts/screen.md`, sections loaded by `load_prompt(mode, kind)`.
- **Provider selection and fallback:** `Session.provider` (set by `session.update`), `Agent._ask_tutor`'s cloud → local fallback chain, `answered_by` → `OverlayMsg.provider/model` for the badge in the phantom menu. `_ask_tutor` gets lifted into a shared helper so `guide/` can call it (today it takes a `PageState` only to emit the error `StatusMsg`).
- **Hint ladder** (non-negotiable 5, DECISIONS #19): rung 1 = the location (the highlight itself), 2 = why, 3 = what the control does, 4 = the full remaining sequence, only on an explicit request ("show me all the steps", the "solution" voice command). Rungs come from `GuideStep.hint_levels`; "hint"/"more" climb with `_voice_commands.next_level`, as on the canvas.
- **Voice:** the same `voice/` session (Silero → Parakeet → Kokoro). Questions ("why?", "what does this do?") go to `Tutor.converse` with the current step as context (`VoiceContext` gains `step: str | None`; `pen_line` is None in screen mode).
- **`RuntimeStatus`:** the overlay gets the same `runtime` message every 5 s; the phantom menu shows the memory light and each `event` once (e.g. "tutor switched to slower mode").
- **Model:** Gemma 4 26B-A4B, the default local tutor (DECISIONS #25), does planning and the VLM fallback; no extra model is loaded, so the memory budget is unchanged. Its bbox accuracy on screenshots is unmeasured; the Perception/Guide phases measure it on `fixtures/screens/`.

## Server side as built (Phases 12–13)

Code: `inktutor_server/screen/` (`session.py` one `ScreenSession` per helper id, owned by the hub; `frames.py`; `commands.py`), `ax/` (`search.py` `AXIndex`, `predicates.py`), `guide/` (`loop.py` `Guide`, the state machine; `plan.py` step validation; `config.py` knobs + recipes), `tutor/prompts/screen.md` (`## rules · plan · locate · verify · explain`), `modes/screen/{config.toml,rubric.md}`, `modes/apps/excel.md` (Spanish + English titles). Tests: `tests/test_screen_perception.py`, `tests/test_screen_guide.py`, fixture `tests/fixtures_screen/excel_pivot_es.json` (synthetic, made by `make_excel_pivot_es.py` next to it).

**What each helper message does.** `screen.hello` → the display layout (every box is fitted into a display and passes `check_event`). `ax.snapshot` → an `AXIndex` (titles normalised once: no case, no accents, no trailing "…"); a blocklisted app or `secure_field_focused` pauses (status `paused`, phantom `capture_paused`, "I'll wait" / "Espero" when a walkthrough is on; the snapshot and later frames are dropped); otherwise: retry locating, follow a moved target, the app-switch check, and `done_when` 300 ms after the newest snapshot. `screen.frame` → the newest frame per display, decoded and dHashed (9×8 grayscale, 64 bits) only when the VLM gate asks. `input.event` → resets the 8 s pulse timer. `guide.goal` → `guide.status planning "Got it — planning: <goal>"` first, then phantom `thinking`, then `Tutor.plan`. `guide.control` → next/back/repeat/pause/resume/stop, each answered with a status. `session.update {voice}` → load the voice engine ("Loading voice…" + phantom `thinking` on the first load, then "Listening"); `{provider}` other than local → "Screen mode is local-only". `voice.audio` → the canvas's `VoiceSession` (VAD → STT); `voice.stop` → barge-in. The hub's inbox (for `GET /api/screen/{id}`) keeps only the small messages; frames, snapshots, audio and input events are neither kept there nor logged. `GET /api/screen/{id}` now also returns `guide` (phase, step, plan with located targets, app, element and frame counts).

**State machine as built.** `idle → planning` (goal) `→ locating` (step 1 arrives; AX now, else caption + spoken line while looking) `→ guiding` (highlight + caption + arrow if the pointer is > 300 pt away; `cap-<step>` is the caption id and the `feedback_id` of the spoken line) `→` next step (done_when held on a snapshot; clear the step, "✓" caption 1.2 s) `→ … → done`. `verifying` is shown while a `vlm_yes_no` check runs. `replanning` when the frontmost app changes (seen in 2 snapshots in a row; the helper's own app is ignored) or a window/dialog opens that no remaining step mentions; the plan's `version` bumps, the goal and the steps done are kept. `paused` (phantom pause, password field, blocklisted app). `error` (no models, model not loaded/loading, connection refused, timeout, HTTP error, empty plan): a plain sentence in the status, phantom `idle`, said aloud when voice is on.

**Rules in code.** One tier-2 call per screen session (`ScreenSession.ask` holds the guide's lock); a new goal or "stop" cancels it; a spoken question cancels a VLM locate (retried on the next changed frame). While the screen session asks, a running canvas review is paused with the canvas agent's own `_pause_reviews`/`_resume_reviews`, and a teacher summary being written is cancelled (it re-queues). Steps: ≤ 15 (the rest is dropped), `speak` ≤ 15 words, unknown `done_when` kinds → `user_next`, steps that would type a password are dropped. A step whose `done_when` already holds when it starts is skipped (the user is ahead) unless the predicate is about the step's own target or the step was entered by "back"/"repeat": then it must be false once first. AX search: role + `title_regex` + path; a role of the same family (AXButton ≈ AXRadioButton ≈ AXMenuButton…) matches with a lower score, password fields never; indexing a 286-element Excel snapshot takes ~1 ms and a search ~0.02 ms (the Phase 12 target is < 100 ms). VLM fallback (`Tutor.locate`): only with a frame, only if the frame's dHash changed (> 4 bits) since the last try for that step, ≥ 2 s apart; the box comes back in image pixels (`{x,y,w,h}`, or `box_2d` 0–1000, or corner `bbox`), is mapped through the crop and the frame's `origin`/`scale` to global points and snapped to an overlapping AX element (IoU > 0.3). Not found after 6 s: "I can't see it yet. Look for <description>." and it keeps retrying. Knobs: `modes/screen/config.toml`.

**Voice routing (no model call for commands).** Whole short utterances (≤ 4 words besides please/ok): next ("next", "siguiente", "següent", "ya está", "done"…), back ("back", "atrás", "enrere"), repeat ("repeat", "repite", "repeteix"), stop ("stop", "para la guía", "parar", "detente", "atura", "prou"; never "para" alone), pause/resume. Ladder (≤ 6 words): why / "¿por qué?" / "per què?" → rung 2, "what does this do?" / "¿qué hace esto?" → rung 3, both from the step's `hint_levels` when the plan has them (else `Tutor.explain` at that level); "show me all the steps" / "todos los pasos" (≤ 9 words) → rung 4, the plan's remaining steps as a caption and spoken, only on that request; the canvas words "hint"/"more" climb from rung 2. Anything else: a new goal when there is no plan (or it is done), else a question about the current step → `Tutor.explain`, spoken sentence by sentence as it streams (`speak_partial`), shown as a caption; the plan stays. Phantom: `listening` when speech starts, `thinking` on the utterance and while tier 2 works, `speaking` with the first audio chunk, back to `listening` after.

**Deviations from the design above.** (1) Screen voice commands live in `screen/commands.py`, a screen-only parser, instead of `voice/session.py`'s `COMMANDS` (the canvas parser is untouched; it is reused for "hint"/"more"). (2) Questions go to a new `Tutor.explain` (prompt `## explain`) instead of `converse` with `VoiceContext.step`, so the canvas `converse` is untouched. `vlm_yes_no` uses `Tutor.locate` with `LocateContext.question` (prompt `## verify`). (3) `_ask_tutor` was not lifted: screen mode is local-only (DECISIONS #32), so `ScreenSession.ask` uses `runtime.tutor("local")`; the cloud tutors' `plan`/`locate`/`explain` raise `NotImplementedError`. (4) A screen session is not a stored `Session` (no `SessionMsg`, nothing in SQLite) and ends when its last helper disconnects; `Mode = "screen"` is unused for now. (5) The first `runtime` message goes out 5 s after connect (then every 5 s), not on connect. (6) The fixture is synthetic and lives with the tests (`fixtures/screens/` stays empty until the screen recorder exists).

## Completion detection details

- Prefer *state* predicates ("PivotTable Fields pane exists") over *action* predicates ("user clicked Insert"): they survive the user taking a different route.
- Use input events only as hints to re-snapshot immediately after a click, not as proof of completion.
- Screenshot diff gates the VLM fallback: no change → no call.

## Voice and the phantom icon

- Voice is the default channel (same `voice/` stack). The phantom icon shows listening state; its menu offers listen on/off, mute, a transcript panel, pause, exit.
- Spoken lines ≤ 15 words per step; details on request ("why?", "what does this do?").
- Barge-in and "next"/"back"/"repeat" voice commands; "stop" exits the walkthrough. *(adapted: these go into `voice/session.py`'s `COMMANDS` next to "hint"/"more"/"step"/"solution", EN/ES/CA, and become `guide.control` actions. Rules: only in screen sessions; placed after "more" so "next hint" stays a hint; matched only on short whole utterances (≤ 4 words), anything longer goes to `converse`; Spanish "para" is not "stop" (it also means "for") — use "stop", "parar", "detente", "prou".)*
- Voice stays local (DECISIONS #27): with the cloud toggle on, only the text of `plan`/`locate`/`converse` calls goes to the provider, never audio. *(adapted: ARCHITECTURE §4.1's "provider's realtime speech API" does not apply here.)*

## Privacy

**Local only for now** (owner, DECISIONS #32): screen mode has no cloud toggle; planning and locating use the local tutor, and the cloud paragraphs below describe a later option. The blocklist stays minimal (the `SCREEN_BLOCKLIST` default).

Screenshots and AX data stay on the Mac. With the cloud toggle on, the user is shown that a downscaled screenshot of the frontmost window (not other displays, not other windows) is what leaves the machine; capture pauses on secure fields and on apps listed in `SCREEN_BLOCKLIST` *(adapted: was `screen.blocklist`; it is an env setting like every other knob, sent to the helper in `screen.config` so blocklisted windows are never captured at all, and the server drops anything that slips through)* (password managers, banking). A visible indicator shows when capture is active. Frames are held in memory only (the last few per display) and never logged; only the screen recorder writes them to disk.

**Networking** *(adapted: DECISIONS #26)*: the iPad reaches the Mac through the Cloudflare tunnel, but the screen tutor is Mac-only: the helper connects over localhost, and the server accepts `/ws/screen/*` only from localhost (requests carrying the tunnel's `cf-connecting-ip`/`cf-ray` headers are refused, `pairing.is_tunnel_request`). Screenshots and AX data never pass Cloudflare's edge. *(Phase 11, `screen/routes.py`)*: every screen route also refuses non-loopback clients (the server listens on 0.0.0.0 for the iPad), a `Host` that isn't a loopback name, and any request with an `Origin` header, so a web page in the Mac's own browser (or DNS rebinding) can't drive the overlay. Dev routes, same gate, until the guide loop (Phase 13) drives the overlay: `POST /api/screen/{id}/overlay` (body: one `OverlayEvent`; 202 `{delivered}`, 404 if no helper is connected, 422 if it breaks a rule), `GET /api/screen/{id}` (connected helpers, displays, the last 50 messages the helper sent: goals, controls, listen on/off), `GET /api/screen` (connected ids).

## Fixtures for this mode

`ink-tutor/tools/screen-recorder/` (to build): records a manual walkthrough as `AXSnapshot`s + downscaled frames + input events + the owner's spoken narration, into `ink-tutor/fixtures/screens/*.json`. Tests replay them: the planner must produce a plan whose targets resolve by AX on the recorded snapshots; the stepper must advance at the recorded completion moments. First fixture: Excel pivot table (Sales by Region), then Numbers chart, then a Finder/System Settings task to prove it is app-agnostic.

## Setup notes (checked on the owner's Mac, 2026-10-24)

- macOS 14.3 (23D56), arm64: ScreenCaptureKit (12.3+) is available, and so is `SCScreenshotManager` (14.0+) for single on-click frames.
- Swift toolchain present: Apple Swift 5.10 (swiftlang-5.10.0.13), SwiftPM 5.10, from the **Command Line Tools 15.3** (`xcode-select -p` → `/Library/Developer/CommandLineTools`); no Xcode.app. SDK 14.4 includes ScreenCaptureKit, AppKit, ApplicationServices (AX) and AVFAudio; `codesign` is there, so `codesign -s -` (ad-hoc) needs no account.
- **No XCTest** in the Command Line Tools, so `swift test` won't run without Xcode.app: the helper's logic gets tested through the server (fixture replays, contract test), plus a small executable self-check if needed.
- PyObjC is not in `tutor-app/uv.lock` (the Python alternative would add it).
- `make overlay` wraps the SwiftPM executable in a small `.app` (Info.plist with `NSMicrophoneUsageDescription`, `LSUIElement` so it has no Dock icon), signs it ad hoc and launches it.
- Expect: macOS ties Screen Recording/Accessibility grants to the code signature, and an ad-hoc signature changes on every rebuild, so permissions may be asked again after rebuilds. A stable self-signed certificate made in Keychain Access (no developer account) avoids that. The owner accepts the re-prompts (DECISIONS #32).

**Build and run (Phase 11)**, from `tutor-app/`:

```bash
make server                          # or make dev / make ipad: the server on :8000
make overlay                         # swift build -c release → .build/InkTutorOverlay.app (Info.plist: LSUIElement,
                                     # mic text) → codesign -s - → runs it in this terminal; Ctrl-C quits
make overlay SERVER=127.0.0.1:8033 SESSION=mac ARGS=--log-frames   # another port; log every window frame and box
make overlay-build                   # build + bundle + sign only
make overlay-test                    # swift run overlay-selftest: coordinates, layout, overlay state, wire examples
curl -X POST http://127.0.0.1:8000/api/screen/mac/overlay -H 'content-type: application/json' \
  -d '{"id":"h1","type":"highlight","bbox":{"x":300,"y":60,"w":60,"h":28},"ttl_ms":8000}'
```

The helper prints the overlay windows (one per display, global and AppKit frames), `connected to ws://127.0.0.1:8000/ws/screen/mac`, the `screen.config` it got, and every box it draws. It refuses a `--server` that isn't localhost. Without a server it retries with backoff (0.5 s doubling to 10 s). The package needs only the Command Line Tools and Apple frameworks (no package dependencies; SwiftPM's caches go to `apps/overlay/.build/swiftpm/`).

What it draws: a rounded orange box with a soft glow (`highlight`, padded 4 pt around the control), an arrow from `from_point` that stops just outside the box (`arrow`), a dark caption bubble below the target (above it, or beside it, when there's no room; clamped into the display; bottom centre with no target), a ring that grows and fades around the target (`pulse`), and `clear`. Each display gets its own borderless, transparent, click-through window (`ignoresMouseEvents`) at `.screenSaver` level with `canJoinAllSpaces` + `fullScreenAuxiliary`, so it sits above normal apps, the menu bar and full-screen spaces; protocol boxes (global points, top-left origin) are converted to each window's AppKit view coordinates (`OverlayCore/Geometry.swift`). The phantom icon is a separate 44 pt round panel (draggable; bottom-right of the main display at start) whose menu has: Ask the tutor… (a text box → `guide.goal`), Listen (→ `session.update {voice}`; the microphone itself comes later), Show transcript (your goals and the tutor's captions), Pause/Resume (→ `guide.control pause/resume`, hides the overlay), Exit (→ `guide.control stop`, quits). Phases 12–13 extend this; see "Helper, Phases 12–13" below.

**Permissions.** Phase 11 needs none: drawing windows over other apps and connecting to localhost don't ask. Screen Recording and Accessibility come with Phase 12 (capture, AX reader), Microphone with voice; macOS asks the first time each is used. `make overlay` runs the binary from the terminal, so macOS attributes those requests to the terminal app (Terminal, iTerm, VS Code); `open apps/overlay/.build/InkTutorOverlay.app` makes the helper itself the one asking (its stdout then goes nowhere; use `--log-frames` from the terminal for debugging). Grants live in System Settings → Privacy & Security → Screen Recording / Accessibility / Microphone; after a rebuild, remove the old "Ink Tutor Overlay" entry and allow it again. Note for Phase 12: the overlay windows are visible to `screencapture` (that's how Phase 11 was checked), so capture must exclude them (`SCContentFilter(…excludingWindows:)`) so the VLM never sees our own highlights.


**Helper, Phases 12–13** (`apps/overlay`; pure logic in `OverlayCore`, checked by `make overlay-test`):

- *Live status.* `OverlayCore/Status.swift` (`StatusModel`) takes every input (socket up/down, Listen, Mute, `guide.status`/`guide.plan`, transcripts, playback, capture pauses, errors) and decides the icon and the bubble. Icon states: idle (slate, sparkles, breathing), listening (green, mic, a ring that follows the mic level), thinking (amber, spinner), speaking (orange, pulse), paused (grey), capture paused (violet, eye-slash), error (red, flash), disconnected (dashed grey, slow blink). A green dot means frames are being captured. The bubble beside the icon shows "Sent — waiting for the tutor…" as soon as a spoken goal goes out. With no `guide.status`/`guide.plan` within 5 s it shows "No answer from the tutor yet (is the model loaded?)", and it stops spinning after 45 s. It also shows "Got it — planning…", "Step n of N: …", the server's `detail`, "Done!", errors, and while you talk the live partial transcript ("“how do I…”"). When the socket is down it shows "Not connected to the app server (127.0.0.1:8000)". It hides by itself when nothing is going on. A separate **"You said: …"** bubble above the icon shows the last recognised sentence for 10 s. An `error` message (not only `guide.status error`) ends planning, so the icon never spins forever. The transcript panel logs You / Tutor / Step / Status / Error lines with times. The menu shows the connection (or "make ipad"), "Step n of N", "Memory low…" from `runtime`, Listen ✓, Mute ✓, Next / Previous / Repeat / Stop walkthrough (`guide.control`, only during a walkthrough), Show transcript, Pause, and the missing permissions only ("Allow microphone… / screen recording… / accessibility…"). Each one shows macOS's prompt, or opens the right System Settings pane.
- *Voice* (`Voice.swift`, DSP in `OverlayCore/Audio.swift`). AVAudioEngine mic tap → AVAudioConverter to 16 kHz mono → 100 ms PCM16 `voice.audio` frames (`pen` left out, i.e. null). Listen turns on by itself when the helper connects (`--no-listen` disables that). Frames go out only while Listen is on, the socket is open and the helper isn't paused. Microphone permission comes via `AVCaptureDevice.requestAccess`. Replies are queued gap-free on an AVAudioPlayerNode at their `sample_rate`; with **Mute** checked they are not played (captions, highlights and the transcript stay). Barge-in works like the web's `BargeIn` (RMS over an adaptive floor, 3 × 20 ms frames): playback stops here and `voice.stop` goes out. macOS voice processing (echo cancellation) gives **pure silence** on the owner's Mac (macOS 14.3: a 3- or 9-channel input that is all zeros, or no tap callbacks at all). So the default is half duplex: while the tutor talks, no mic frames go to the server; the first 250 ms of playback teach the detector the speakers' echo; only a voice clearly above it barges in. `--aec` tries voice processing anyway and falls back by itself if the first 1.5 s are silent. Listen off throws the engine away, so the mic (and macOS's orange dot) is really off. Listen is re-sent after a reconnect. When the server says voice can't run (`error`/`guide.status` starting "voice"), the mic turns off and the message stays.
- *Perception* (`Perception.swift`, `AXReader.swift`, `Capture.swift`; walker in `OverlayCore/AXWalk.swift`):
  - *Frames.* `SCScreenshotManager` at `capture_fps` captures the display under the frontmost window (CGWindowList bounds). It adds one frame per click (`trigger: click`) and per app/window change (`focus`). Frames are ≤ 1280 px wide, JPEG q 0.6, with `origin`/`scale`/`window` filled in. The `SCContentFilter` excludes the helper's own windows and every blocklisted app.
  - *AX snapshots.* The reader walks the focused window breadth-first: ≤ 300 sent elements, depth ≤ 14, tables and lists capped at 24 children. Each element carries role, title (AXTitle → AXDescription → AXHelp), a value for short-value roles only, frame, enabled, a `role:title` path, and an id that is the child-index chain (`w.0.3`). The snapshot adds the app's other windows, the menu bar and open menu when a menu is open, the focused element (with its ancestors' path if the walk didn't reach it) and the pointer.
  - *When snapshots go out.* Immediately on a click and again 300 ms later; 300 ms after a key or an AX focus/window/menu/sheet notification; every 2 s during a walkthrough (5 s otherwise). Typical cost is 10–40 ms. Anything over 100 ms is logged (the first, cold one on VS Code took 112 ms).
  - *Input events.* `input.event` covers clicks (with `at`) and keys (no content, at most one per 300 ms), from NSEvent global monitors.
  - *Capture pause.* A blocklisted app in front, an AX secure text field focused, or macOS secure keyboard entry on (`IsSecureEventInputEnabled`) means no frames. Snapshots then carry the app name only, with `elements: []`. A secure field sets `secure_field_focused`, and a value is never read for secure fields. The icon goes capture-paused with the reason.
  - *Missing permissions.* Without Accessibility, snapshots carry the app name only. Without Screen Recording, there are no frames. Voice and highlights still work either way.
  - *Timestamps.* `t_ms` is epoch milliseconds.
- *Flags:* `--log-ax` (sizes and timings of every snapshot and frame, the mic level every 2 s), `--record DIR` (every message sent, to `DIR/messages.jsonl`; frames as `DIR/<id>.jpg`, with `jpeg_b64` replaced by `"@<id>.jpg"`; use `ink-tutor/fixtures/screens/…`, git-ignored), `--no-prompts` (don't show macOS's Screen Recording / Accessibility prompts at launch), `--no-capture` (voice and highlights only), `--aec`, `--smoke` (dev: 3 s after launch, asks a test goal, then turns Listen on for 6 s). Every icon/bubble change is printed (`phantom: thinking · Sent — waiting for the tutor…`), and so is every transcript line.
- *Permissions in practice.* `make overlay` runs the binary from the terminal, so macOS asks for (and lists) the terminal app (VS Code, Terminal). `open apps/overlay/.build/InkTutorOverlay.app` makes "Ink Tutor Overlay" itself the one asking. Screen Recording takes effect only after the helper restarts; Accessibility within a few seconds (the helper re-checks every 2 s). The bundle id stays `dev.inktutor.overlay`. After a rebuild the ad-hoc signature changes, so remove and re-add the entry if a grant stops working.

## Why this shares the architecture

Same tier-2 model (bounding boxes, screen understanding), same agent skeleton (observe → check → guide → wait), same hint ladder and never-do-it-for-them rule, same voice, same provider toggle, same memory budget. The differences are two adapters: an input adapter (screen + AX instead of strokes) and an output adapter (overlay instead of marks on ink).

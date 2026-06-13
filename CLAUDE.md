# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Web dev server (http://localhost:55000)
npm run dev

# Build for production
npm run build

# Run as Tauri desktop app (dev)
npx tauri dev

# Build Tauri desktop app
npx tauri build

# Clean dist
npm run clean

# Run Playwright tests (headless)
npm test

# Run Playwright tests with interactive UI
npm run test:ui
```

## Testing

Tests use **Playwright** (`tests/`). The dev server must be running, or Playwright will start it automatically via the `webServer` config in `playwright.config.ts`.

### Test notebooks

Test fixtures live in `public/test/` as plain `.ipynb` files served statically by Vite. Each notebook tests a specific area of focus. To open one manually in the browser: `http://localhost:55000/#/test/<filename>.ipynb`.

The `/test/:filename` route (`src/views/TestNotebook.vue`) fetches the notebook from `/test/<filename>` at runtime — no IndexedDB involvement, no auto-save. This keeps test runs isolated and leaves user storage untouched.

### Writing a new test

1. Add a notebook to `public/test/` (e.g. `public/test/matplotlib.ipynb`)
2. Add a spec file to `tests/` (e.g. `tests/matplotlib.spec.ts`)
3. Navigate to `/#/test/<filename>.ipynb` in the test
4. Wait for Pyodide to be ready: `await expect(page.getByRole('button', { name: 'Run code' })).toBeEnabled({ timeout: 90_000 })`
5. Click the run button, then assert on `textarea.output-console` (stdout) or other output selectors

> **Do not use `NotebookEdit` to edit notebooks in `public/test/`.** It writes `source` as a plain string instead of the required array-of-lines format, which breaks the notebook parser. Use `Write` with explicit JSON instead.

### Key selectors

- **Run button** — `page.getByRole('button', { name: 'Run code' })`; disabled while Pyodide is initialising, enabled when ready
- **stdout output** — `page.locator('textarea.output-console')`; only in the DOM when the stdout tab is active (Vuetify tab window items use `v-if`)
- **Pyodide ready** — inferred from the run button becoming enabled (no direct DOM indicator)
- **Edit mode active** — `page.locator('.cell-toolbar').first()` visible; use `?edit=true` on the test URL to activate
- **Textarea value** — use `toHaveValue()` not `toContainText()` for `<textarea>` elements; `toContainText` reads innerHTML, not the input value
- **Multi-element locators** — Playwright strict mode rejects `.toBeVisible()` when a locator matches more than one element; use `.first()` or `.nth(n)` to disambiguate

### Testing camera / cv features

Tests that use the webcam must pass fake-camera flags and grant the `camera` permission:

```typescript
test.use({
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
  permissions: ["camera"],
});
```

Chromium's fake device provides a synthetic video stream that MediaPipe can detect faces in. After clicking Run, wait for `.canvas-output canvas` to appear before switching to the stdout tab to read detection output.

### CI

Two workflow files in `.github/workflows/`:

- **`main.yml`** — triggers on push to `main`; runs tests first, then deploys to GitHub Pages only if tests pass (`needs: test`)
- **`playwright.yml`** — triggers on pull requests to `main`; runs tests only (no deploy)

Playwright and the Chromium browser are installed fresh each CI run via `npx playwright install --with-deps chromium`.

## Architecture

This is a Jupyter notebook client for K-12 students. It runs as either a web app or a Tauri desktop app. Python execution happens entirely in-browser via **Pyodide** running in a Web Worker — there is no server.

### Data flow

1. Notebooks are stored in **IndexedDB** (`src/storage/notebookStorage.ts`) and loaded by UUID.
2. On open, `notebookStore` (reactive Vue store) holds the live notebook state. Every mutation sets `notebookStore.updated`, which triggers the auto-save composable to debounce-write back to IndexedDB.
3. The `Renderer.vue` component renders cells by type. `PyodideProvider.vue` (mounted alongside the renderer) owns the Web Worker lifecycle and bridges messages between the worker and `pyodideStore`/`notebookStore`.
4. `PyodideWorker.ts` runs Pyodide in a separate thread. It handles package loading, stdout/stderr capture, `input()` interception, and result serialization back to the main thread.

### Key stores (`src/store/`)

- `notebookStore` — the live notebook content; all cell reads/writes go through here
- `pyodideStore` — worker lifecycle state (`initializing → ready`), execution queue, interrupt buffer, and `input()` handshake
- `settingsStore` — theme and locale, persisted to `localStorage`

### Cell types (`src/celltypes/`)

Each cell type is a self-contained directory with an `index.ts` export:
- `code` — CodeMirror editor + execution controls + result/stdout/error display
- `markdown` — rendered markdown via `marked`; double-click (or pencil icon) to edit when notebook edit mode is active
- `video` — video player via `video.js`; triggered by `raw` cells tagged with `"video"` in `cell.metadata.tags`; cell source is a JSON payload `{ "url": "...", "controls": true }`
- `chat` — LLM chat interface
- `journal` — student-editable note cell; triggered by `markdown` cells tagged with `"journal"` in `cell.metadata.tags`; double-click (or click the pencil icon) to enter edit mode, Close to save. See `docs/cell-types/journal.md`.
- `cfu` — "Check for Understanding" quiz cell; triggered by `raw` cells tagged with `"cfu"` in `cell.metadata.tags`; cell source is a JSON payload (see below).

**CFU JSON schema:**
```json
{
  "question_type": "freeform" | "multiple_choice" | "true_false",
  "question": "Question text shown to the student",
  "answer": "correct answer (string, case-insensitive match)",
  "options": [{ "key": "a", "text": "Option text" }],
  "submitted_answer": "",
  "animation": true,
  "i18n": { "ja-JP": { "question": "...", "answer": "...", "options": [...] } }
}
```

- `options` is required for `multiple_choice`; omit for other types
- `submitted_answer` is written back to the cell source when the student submits, so their answer persists across reloads
- `animation` defaults to `true`; set to `false` to disable the confetti on a correct answer
- `i18n` per-locale overrides work the same as for other cell types
- In notebook edit mode, a pencil icon on the CFU card opens a raw JSON textarea editor

### Edit mode

Notebooks open in read-only mode by default. Edit mode is toggled via the pencil icon in the notebook header, or activated from a deep link with `?edit=true` (useful for CMS integration).

**What edit mode enables:**
- **Markdown cells** — double-click or click the pencil icon to open an inline textarea editor; Close saves and re-renders
- **CFU cells** — pencil icon opens a raw JSON textarea; Close saves and re-parses
- **All cells** — a toolbar appears above each cell with ↑ ↓ (reorder) and 🗑 (delete with confirmation dialog) buttons
- **Insert bars** — a centered "+ Add cell" bar appears between every pair of cells (and at the top/bottom); clicking it opens a menu to insert a `markdown`, `code`, `journal`, or `cfu` cell

**Implementation:**
- `editMode` is a `ref<boolean>` in `Notebook.vue`, read from `route.query.edit` on mount and passed as a prop down to `Renderer.vue` and then to `MarkdownCell` and `CfuCell`
- `TestNotebook.vue` also reads `?edit=true` so the test route supports edit mode
- `notebookStore` exposes `addCell(cellType, insertAfterCellId)`, `deleteCell(cellId)`, `moveCellUp(cellId)`, `moveCellDown(cellId)`
- New notebooks created from the index ("Add → New Notebook") are saved to IndexedDB and immediately opened with `?edit=true`; they start with a single markdown cell pre-populated with `# {title}`

### Notebook metadata extensions

**Title** — `notebook.metadata.title` sets a friendly display name; falls back to filename if absent.

**Folder** — `notebook.metadata.folder` places a notebook in a pseudo folder hierarchy (e.g. `"/lessons/123"`). The notebooks index builds the folder tree from these values at runtime; folders have no independent existence. Paths are normalised to always have a leading slash. See `docs/folders.md`.

**Globals** — `notebook.metadata.globals` defines named values substituted at runtime using `{{VARIABLE}}` syntax in markdown and code cells. Each global can have a `"default"` and per-locale overrides (e.g. `"hi-IN"`, `"ja-JP"`).

**Form fields** — Code cells support Google Colab-compatible `#@param` annotations for interactive widgets: plain values, sliders (`type:"slider"` with `min`/`max`/`step`), dropdowns (array of values), and booleans (`type:"boolean"`).

### i18n

Locale strings live in `src/i18n/labels/`. The active locale is stored in `settingsStore.locale`. Cell source can have per-locale overrides in `cell.metadata.i18n[locale]` — when the locale matches, the renderer replaces the cell source with the localized content. This is recommended for markdown cells only; using it on code cells risks overwriting student-edited code on locale change. Global substitution (`{{VARIABLE}}`) also resolves per locale.

### Pyodide specifics

- Pyodide assets live at `public/pyodide/` and are committed to the repo.
- The worker requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers — these are set in `vite.config.mjs` for both dev and preview.
- `SharedArrayBuffer` is used for interrupt support when available; the worker gracefully degrades without it.
- `python_init.py` sets up stdout overrides and async `input()` transforms on worker startup. `python_reset_globals.py` clears Python globals between notebook loads.

### Sample files (`public/sample_files/`)

Static files made available to student Python code via Pyodide's virtual filesystem.

- Files live in `public/sample_files/` and are served statically by Vite.
- `manifest.json` in the same directory lists every file by name (array of strings).
- At worker startup, `mountSampleFiles()` in `PyodideWorker.ts` fetches each file and writes it into Pyodide's FS at `/sample_files/<filename>`.
- Student code accesses them as normal paths: `open('/sample_files/chime.wav', 'rb')`.
- To add a new file: drop it in `public/sample_files/` and add its name to `manifest.json`.

Current files:
- **Images:** `abstract.jpg`, `cat.jpg`, `city.jpg`, `codercub.jpg`, `dog.jpg`, `earth.jpg`, `fabric.jpg`, `forest.jpg`, `undersea.jpg`
- **Sounds:** `clang.wav`, `coin_pickup.wav`, `correct.wav`, `door.wav`, `gameover.wav`, `incorrect.wav`, `laser.wav`, `pop.wav`, `thud.wav`, `wood.wav`, `zap.wav`
- **Music:** `music_ambience.wav`, `music_bach.wav`, `music_sibelius.wav`

### via.js bridge

The bridge enables synchronous DOM calls from the Pyodide worker (which has no DOM access) using `SharedArrayBuffer` + `Atomics`.

**How it works:**
1. Worker calls `viaSync(command)` — posts a `"via"` message to the main thread, then blocks on `Atomics.wait`.
2. Main thread (`PyodideProvider.vue`) receives the message, performs the DOM operation, writes the JSON result into a shared `Uint8Array`, and calls `Atomics.notify` to wake the worker.
3. Worker reads the result and returns it.

**Key files:**
- `src/bridge/viaStore.ts` — shared handle registry (`viaRegister`, `viaGet`, `viaClear`). Maps integer handles to live JS objects; imported by both `PyodideProvider.vue` and `CanvasResult.vue`.
- `PyodideWorker.ts` — sets up the two SABs (`viaSignalSAB` 8 bytes, `viaDataSAB` 64 KB), registers `_via_call` and `_via_set` Python globals, and defines `viaSync`.
- `PyodideProvider.vue` — `"via"` message handler; dispatches to library-specific handlers first, then handles the generic `call` and `set` ops.

**Python side (`DOMProxy` in `cv/cv.py`):** attribute access on a proxy returns a callable that calls `_via_call(handle, camelCaseName, args)`; attribute assignment calls `_via_set`. Snake_case is converted to camelCase automatically. Arrays and plain objects cross the bridge as values (JSON); anything else is registered as a new handle and returned as another `DOMProxy`.

**Adding a new library:** create `src/pyodide/<lib>/worker.ts` exporting `initialize<Lib>(pyodide, viaSync, runPythonFile)` and `src/pyodide/<lib>/provider.ts` exporting `handle<Lib>Op(op, command, viaRespond) → Promise<boolean>`. Wire one call into each host file. See `src/pyodide/cv/` as the reference implementation.

### cv module (`src/pyodide/cv/`)

Provides a `cv` Python module for webcam streaming and computer vision.

| File | Purpose |
|---|---|
| `cv.py` | Python `cv` module: `get_canvas`, `start_camera`, `start_face_detector`, `start_object_detector`, `DOMProxy` |
| `cv.pyi` | Type stubs for editor autocompletion |
| `worker.ts` | Registers Python globals for all cv ops; loads `cv.py` |
| `provider.ts` | `handleCvOp` — handles all `create_*` via ops on the main thread |
| `objectDetectionWorker.ts` | Dedicated Web Worker that runs EfficientDet-Lite0 inference off the main thread |

**Python API:**
```python
canvas = cv.get_canvas()                            # auto-sizes to cell width, 4:3 aspect ratio
canvas = cv.get_canvas(width, height)               # explicit pixel dimensions
camera = cv.start_camera(canvas)                    # starts webcam → rAF loop draws frames
detector = cv.start_face_detector(camera)           # BlazeFace model
detector = cv.start_object_detector(camera, delegate="CPU")  # EfficientDet-Lite0; delegate="GPU" also supported
detections = detector.get_detections()              # → list of {type, x, y, w, h, confidence}
canvas.draw_bounding_boxes(detections)              # renders labels + boxes on the rAF overlay
camera.stop() / detector.stop()
```

Each detection dict has the same shape for both detectors: `{"type": "face"|"<label>", "x": int, "y": int, "w": int, "h": int, "confidence": float}`. Coordinates are in logical canvas pixels.

**Canvas controller** (what Python's `canvas` variable wraps): holds `_canvas` (raw `HTMLCanvasElement`), `_logicalWidth/Height`, `_dpr`, `_overlayFn` (drawn each rAF tick), and `drawBoundingBoxes(detections)`. The backing buffer is scaled by `devicePixelRatio` for sharp rendering on HiDPI displays; all drawing uses `ctx.scale(dpr, dpr)` so coordinates stay in logical pixel space. The raw element is registered under a separate display handle so `CanvasResult.vue` can append it to the DOM.

**Camera controller** (`_cameraRef`): exposes a `_cameraRef.onFrame` slot that detectors can write to. Each rAF tick, after drawing the video frame, the tick calls `cameraRef.onFrame?.(video)`. This allows detectors to receive frames without the camera needing to know about detectors.

**Object detection worker** (`objectDetectionWorker.ts`): runs MediaPipe `ObjectDetector` off the main thread so inference never blocks the camera's rAF loop. The main thread sends each video frame as a zero-copy `ImageBitmap` transfer; the worker posts raw `Detection[]` back; the main thread scales coordinates and caches them. `getDetections()` returns the cache instantly.

**Vite / WASM loading caveat:** `@mediapipe/tasks-vision` loads its WASM glue via `importScripts()` in classic workers and `import()` in module workers. Vite dev mode blocks `import()` of files in `/public`. `objectDetectionWorker.ts` overrides `self.importScripts` with a synchronous-XHR + indirect-`eval` implementation before importing the library, so the WASM is always fetched as a plain HTTP request regardless of worker type. This override must remain at the top of the file, before the static `import` of `@mediapipe/tasks-vision`.

**GPU delegate fallback:** if `delegate="GPU"` is requested but unavailable, the object detector automatically falls back to CPU and prints a warning to the student's stdout via the via.js response `warning` field (handled in `cv.py`'s `_decode()`).

**MediaPipe assets** live at `public/mediapipe/` (committed):
- `wasm/` — `vision_wasm_internal.js/.wasm` and `vision_wasm_module_internal.js/.wasm`
- `models/face_detector.tflite` — BlazeFace short-range model
- `models/efficientdet_lite0.tflite` — EfficientDet-Lite0 object detection model (13 MB)

These are served locally to satisfy the `require-corp` COEP header requirement.

**`CanvasResult.vue`** (`src/celltypes/code/results/CanvasResult.vue`) — renders when a cell result contains the MIME type `application/x-via-canvas`. The value is the handle integer for the raw `HTMLCanvasElement`; the component calls `viaGet(handle)` and appends the element to a container div. CSS `max-width: 100%; height: auto` makes the canvas scale responsively on narrow viewports.

### audio module (`src/pyodide/audio/`)

Provides an `audio` Python module for playing sound files from the virtual filesystem.

| File | Purpose |
|---|---|
| `audio.py` | Python `audio` module: `play`, `play_async`, `play_note`, `play_note_async`, `play_notes`, `play_notes_async`, `speak`, `speak_async`, `Voice` |
| `worker.ts` | Registers `_audio_play` / `_audio_play_nowait` / `_audio_note_play` / `_tts_speak` bridge globals; loads `audio.py` |
| `provider.ts` | `handleAudioOp` — handles `audio_play` (HTMLAudioElement), `note_play` (Web Audio API), and `tts_speak` (Web Speech API) ops |

**Python API:**
```python
import audio

audio.play('/sample_files/chime.wav')        # blocks until playback ends
await audio.play_async('/sample_files/chime.wav')  # starts playback, returns immediately

# Note names: letter + optional accidental (# or b) + octave, e.g. "C4", "F#3", "Bb5"
audio.play_note('C4', 0.5)                   # single note, blocks until done
audio.play_note(['C4', 'E4', 'G4'], 1.0)     # chord (list of note names)
await audio.play_note_async('A4', 0.25)      # non-blocking

audio.play_notes([                           # sequence of (note, duration) tuples
    ('C4', 0.4), ('E4', 0.4), ('G4', 0.4),
    (['C4', 'E4', 'G4'], 1.0),               # chord in a sequence
])
await audio.play_notes_async(melody)         # non-blocking sequence

audio.speak("Hello, world!")                          # blocks until speech finishes
audio.speak("G'day!", voice=audio.Voice.EN_AU.FEMALE) # with a specific voice
await audio.speak_async("This doesn't block.")        # fire and forget

# Available Voice constants (all have .FEMALE and .MALE):
# Voice.EN_US  Voice.EN_GB  Voice.EN_AU
# Voice.FR_FR  Voice.DE_DE  Voice.ES_ES  Voice.IT_IT  Voice.PT_BR
# Voice.JA_JP  Voice.ZH_CN  Voice.KO_KR  Voice.HI_IN  Voice.AR_SA
```

**How file playback works:** Python reads the file bytes, base64-encodes them into a data URL, and sends it over the via.js bridge. The main thread creates an `HTMLAudioElement`, plays it, and — for `play()` — waits for the `ended` event before responding so the worker stays blocked for the duration. For `play_async()` the main thread responds as soon as `.play()` resolves. A module-level `Set` in `provider.ts` holds references to active `Audio` elements to prevent garbage collection before playback ends.

**How note playback works:** Python parses note names to Hz (`440 * 2^((midi-69)/12)`), serialises the full sequence as JSON, and makes a single `_audio_note_play` via bridge call. The main thread schedules all notes up-front using `AudioContext` time offsets so the sequence plays gaplessly with no per-note round trips. Each note uses a triangle-wave oscillator with a piano-like ADSR envelope (5ms attack, 120ms decay, 0.4 sustain, 150ms release). The `AudioContext` is a lazy singleton. For `play_notes()` the main thread `setTimeout`-waits for the full sequence duration before responding; for `play_notes_async()` it responds immediately after scheduling.

**How TTS works:** `speak()` / `speak_async()` send the text and a serialised `VoiceSpec` (`{lang, gender}`) over the via.js bridge. The main thread resolves the voice using a priority-ordered name list in `TTS_VOICE_PRIORITY` (keyed by `"lang/gender"`), falling back to any voice whose lang code matches, then calls the browser's `SpeechSynthesis` API. `speak()` blocks until the `onend` event; `speak_async()` responds immediately after `speechSynthesis.speak()`. Voices are loaded via `speechSynthesis.getVoices()` with an `onvoiceschanged` fallback — on a cold browser start, the first call may find no voices; a page refresh resolves this.

`play_async`, `play_note_async`, `play_notes_async`, and `speak_async` are declared `async def` intentionally — students must `await` them, which is the teaching moment.

Supported formats: WAV, MP3, OGG, M4A, FLAC (MIME type inferred from file extension).

### scene3d module (`src/pyodide/scene3d/`)

Provides a `scene3d` Python module for interactive 3D scenes using BabylonJS.

| File | Purpose |
|---|---|
| `scene3d.py` | Python `scene3d` module: `Scene`, `Camera`, `AmbientLight`, `Light`, `Shapes`, `Sky`, `Material`, `DOMProxy` |
| `scene3d.pyi` | Type stubs for editor autocompletion |
| `worker.ts` | Registers `_scene3d_call` and `_scene3d_wait_event` bridge globals; loads `scene3d.py` |
| `provider.ts` | `handleScene3dOp` — handles all scene/mesh ops and the deferred event loop on the main thread |

**Python API:**
```python
import scene3d, math

scene = scene3d.Scene()          # creates canvas + BabylonJS engine, shows output immediately
scene.set_sky("#87CEEB")         # background colour
scene.set_sky(scene3d.Sky.CLOUDS)  # HDR environment skybox (also drives PBR reflections)

ground = scene.set_ground(length=20, width=20)  # returns a Mesh
ground.set_material(scene3d.Material.Grass.Bright)
ground.set_tiling(10)            # repeat texture 10× across the ground

box = scene3d.Shapes.Box(width=1, height=1, depth=1)
box.set_position(0, 0.5, 0)
box.set_rotation(y=45)           # degrees; any combination of x, y, z
box.set_color("#cc4400")
box.set_texture('/sample_files/cat.jpg')   # file path from Pyodide FS
box.set_texture('data:image/png;base64,…') # data URL (e.g. from AI model)
box.set_material(scene3d.Material.Bricks.DarkClay)  # PBR material with normal + roughness maps
box.set_glossiness(0.3)          # 0.0 = matte, 1.0 = mirror-like (PBR materials only)
box.on_click(lambda: box.set_color("#ff0000"))
scene.add(box)

sphere = scene3d.Shapes.Sphere(diameter=1, segments=16)
scene.add(sphere)

# Collision detection — register on_collide before scene.run(); both meshes must be added first
box.on_collide(sphere, lambda: box.set_color("#00ff00"))  # fires once on bounding-box entry

# Key handling — register on_key before scene.run(); camera arrow-key bindings are removed automatically
scene.on_key(scene3d.Key.LEFT,  lambda: box.set_position(-1, 0, 0))
scene.on_key(scene3d.Key.RIGHT, lambda: box.set_position(1, 0, 0))
scene.on_key(scene3d.Key.UP,    lambda: box.set_position(0, 0, 1))   # +z = away from default camera
scene.on_key(scene3d.Key.DOWN,  lambda: box.set_position(0, 0, -1))
scene.on_key(scene3d.Key.SPACE, lambda: print("jump!"))
scene.on_key('w', lambda: box.set_position(0, 0, 1))  # plain string for letter keys

ctx = scene.get_context('2d')    # 2D overlay canvas for HUD drawing

angle = 0.0

@scene.on_frame                  # also callable as scene.on_frame(fn)
def animate(dt):                 # dt = seconds since last frame
    global angle
    angle += 90 * dt
    box.set_rotation(y=angle)
    ctx.clear()
    ctx.fill_style = '#ffffff'
    ctx.fill_text(f'Angle: {angle:.1f}°', 10, 24)

scene.run()                      # blocks Python in event loop; Stop button works
```

**Shapes:** `Shapes.Box(width, height, depth)`, `Shapes.Sphere(diameter, segments)`, `Shapes.Cylinder(diameter, height, tessellation)`.

**Mesh methods:** `set_position(x, y, z)`, `set_rotation(x, y, z)` (degrees), `set_scale(x, y, z)`, `set_color(hex)`, `set_texture(source)`, `set_material(constant)`, `set_glossiness(value)`, `set_tiling(u, v=None)`, `on_click(fn)`, `on_collide(other_mesh, fn)`. All keyword arguments default to 0 (or 1 for scale), so `set_rotation(y=45)` is valid. `set_ground` also returns a `Mesh` so all these methods apply to the ground too.

**Mesh getters:** `get_position()` → `(x, y, z)` tuple, `get_rotation()` → `(x, y, z)` tuple in degrees, `get_scale()` → `(x, y, z)` tuple, `get_color()` → hex string. All read Python-side state (no bridge round-trip); values are always in sync because every `set_*` call updates the local state immediately. Note: once physics is added, `get_position()` and `get_rotation()` will need to read live BabylonJS state via the bridge instead.

**`AmbientLight` (`scene.ambient`):** controls the built-in `HemisphericLight` that illuminates the whole scene.
- `set_brightness(value)` — `0–100` student scale, maps to `0.0–1.0` BabylonJS (÷ 100); default `90`; `0` = pitch black, `100` = fully lit
- `set_color(hex)` — tint the ambient light (e.g. `"#ffddcc"` for warm, `"#cceeff"` for cool)

**`Light` (`scene.add_light(x, y, z)`):** adds a `PointLight` at the given position and returns a `Light` object.
- `set_position(x, y, z)` — move the light
- `set_brightness(value)` — `0–100` student scale, maps to `0–20` BabylonJS (÷ 5); default `100`; gives enough intensity to visibly illuminate nearby meshes
- `set_color(hex)` — light colour; indicator sphere tint updates to match
- `set_visible(True/False)` — toggle a small emissive indicator sphere at the light's position; hidden by default, useful while building scenes
- `remove()` — dispose the light and its indicator

```python
light = scene.add_light(0, 5, 0)         # point light overhead (default brightness 100)
light.set_brightness(80)
light.set_color("#ff4400")               # warm orange
light.set_visible(True)                  # show indicator while positioning
light.set_position(3, 5, -2)
light.set_visible(False)                 # hide indicator for final scene
```

**`Camera` (`scene.camera`):** exposed as a property on every `Scene` instance. All methods return `self` for chaining. The underlying BabylonJS `ArcRotateCamera` stays active — mouse orbit and scroll-wheel zoom work on top of any Python camera call.
- `set_position(x, y, z)` — teleport the camera to a world-space position; BabylonJS recomputes alpha/beta/radius automatically
- `move(dx, dy, dz)` — translate by a relative amount
- `look_at(mesh_or_x, y=0, z=0)` — point camera at a mesh (`look_at(box)`) or world coordinates (`look_at(0, 0, 0)`)
- `set_distance(r)` — set zoom (ArcRotateCamera radius from its target)
- `follow(mesh, distance=None)` — register a before-render observer that copies the mesh's world position to `camera.target` every frame; optional `distance` sets the radius; `follow(None)` removes the observer
- `reset()` — remove any follow observer and restore default alpha/beta/radius/target

**`Group`:** groups multiple meshes under a shared `TransformNode` so they move and rotate as a single unit. Create a `Group`, add meshes to it with `group.add(mesh)`, then pass the group to `scene.add()`. Child mesh positions and rotations are relative to the group origin. The group supports `set_position`, `set_rotation`, `set_scale`, `get_position`, `get_rotation`, `get_scale` — identical signatures to `_Mesh`. Groups have no appearance of their own (`set_color`, `set_material`, etc. are not available on a `Group`). This is the correct foundation for physics: a future physics pass will attach a compound impostor to the `TransformNode`, keeping the assembly together as a single rigid body.

```python
car = scene3d.Group()

body = scene3d.Shapes.Box(width=2, height=0.5, depth=1)
body.set_color('#cc2200')

wheel = scene3d.Shapes.Cylinder(diameter=0.4, height=0.15, tessellation=16)
wheel.set_rotation(z=90)
wheel.set_position(0.8, 0, 0.5)
wheel.set_color('#222222')

car.add(body)
car.add(wheel)
car.set_position(0, 0.5, 0)
scene.add(car)                   # adds the TransformNode + all children in one call

car.set_rotation(y=45)           # rotates the whole group; individual meshes stay intact
```

**`set_texture(source)`:** accepts a file path (reads from Pyodide FS, base64-encodes internally), a `data:` URL, or a raw base64 string (assumed PNG). Setting a texture resets `diffuseColor` to white; call `set_color` after `set_texture` to apply a tint.

**`set_material(constant)`:** applies a PBR material (colour + normal + roughness maps) or simple diffuse texture from the `Material` class. HDR material files live at `public/3dassets/materials/`. Categories and constants:
- `Material.Bricks` — `DarkClay`, `RoughStone`
- `Material.Carpet` — `BlueCheckerboard`, `BeigePattern`
- `Material.Chip` — `CircuitGreen`, `CircuitRed`, `CircuitOrange`, `CircuitBlue`
- `Material.Fabric` — `BurgundyRibbed`, `BlueQuilted`, `BlackTartan`, `RedBlueCheck`, `Denim`
- `Material.Grass` — `Bright`, `Dark`, `Olive`
- `Material.Gravel` — `LightGray`, `DarkGray`
- `Material.Marble` — `Brown`, `Gray`, `Black`, `Charcoal`
- `Material.Planets` — `Earth`, `Jupiter`, `Mars`, `Mercury`, `Neptune`, `Saturn`, `Uranus`, `Venus`, `Moon` (simple diffuse)
- `Material.Road` — `PatchedAsphalt`, `AsphaltEdges`, `Highway`
- `Material.RoofingTiles` — `DarkSlate`
- `Material.Snow` — `Fresh`
- `Material.Sports` — `Soccerball`, `Tennis` (simple diffuse)
- `Material.Tiles` — `LimeGreen`, `GreenMosaic`, `WoodHexagon`, `Checkerboard`
- `Material.Wood` — `Oak`
- `Material.WoodFloor` — `PinePlanks`

**`set_glossiness(value)`:** sets PBR surface glossiness; `0.0` = completely matte, `1.0` = mirror-like. Maps to `roughness = 1 - value` in BabylonJS `PBRMaterial`. No-ops on plain colour/texture meshes (which use `StandardMaterial`).

**`set_tiling(u, v=None)`:** repeats the texture `u` times horizontally and `v` times vertically (`v` defaults to `u`). Stored in the mesh's BabylonJS `metadata` so it survives a subsequent `set_material` call.

**`set_sky(color)`:** accepts a hex colour string (e.g. `"#87CEEB"`) or a `Sky` constant for an HDR environment skybox. Available constants: `Sky.CLOUDS`, `Sky.DEEP_SPACE`, `Sky.MODERN_BUILDINGS`, `Sky.ORLANDO_STADIUM`, `Sky.PURE_SKY`. Environment files live at `public/3dassets/environments/`. When an env skybox is set, the same `CubeTexture` is also assigned to `scene.environmentTexture` so PBR materials automatically receive Image-Based Lighting (IBL) reflections. Cleared when switching back to a flat colour.

**`scene.import_meshes(meshes)`:** creates and adds meshes from a list of descriptors. Each descriptor is a dict or a Pydantic model instance (normalized via `model_dump()` automatically). Supported fields:
- `type` — `"Box"` | `"Sphere"` | `"Cylinder"` (case-insensitive; unknown types are silently skipped)
- `position` — `[x, y, z]` (default `[0, 0, 0]`)
- `rotation` — `[x, y, z]` degrees (default `[0, 0, 0]`)
- `scale` — `[x, y, z]` (default `[1, 1, 1]`)
- `color` — hex string (default grey)
- `material` — dotted string resolved against the `Material` class, e.g. `"Grass.Bright"` → `Material.Grass.Bright`; unrecognised strings are silently ignored
- Shape params: `width`/`height`/`depth` for Box; `diameter`/`segments` for Sphere; `diameter`/`height`/`tessellation` for Cylinder

Designed for use with OpenAI structured output — the student defines a Pydantic model whose schema the LLM must conform to, calls `client.beta.chat.completions.parse(..., response_format=SceneDescription)`, then passes `result.choices[0].message.parsed.meshes` directly to `import_meshes`. Returns `self` for chaining. Implemented entirely in Python using the existing Shapes/add API — no new bridge calls required.

**Scene defaults:** ArcRotateCamera (mouse orbit/zoom), HemisphericLight, dark background. Mouse wheel zoom is decoupled from page scroll. The camera is also exposed as `scene.camera` for programmatic control — see **`Camera`** above.

**Event loop (`scene.run()`):** calls `viaSyncTimed(250ms)` in a loop. The 250 ms timeout lets Pyodide check the interrupt buffer so the Stop button works within ~250 ms. On a frame event the loop calls the registered `on_frame` handler; on a click event it calls the mesh's `on_click` handler; on a collide event it calls the matching `on_collide` handler; on a key event it calls the matching `on_key` handler. Collision handlers are registered at the start of `scene.run()` (not at `scene.add()` time), so `on_collide` may be called any time before `scene.run()` as long as both meshes have been added to the scene. Key handlers are also registered at `scene.run()` start; registering any key handler automatically removes the camera's arrow-key bindings (mouse orbit is preserved) and focuses the canvas.

**Frame callbacks:** BabylonJS's `onBeforeRenderObservable` fires each render tick. It dispatches a frame event only when Python is already waiting (i.e. `_pendingRespond` is set). If Python is still processing the previous frame, the tick is silently skipped — no queue buildup.

**2D overlay (`scene.get_context('2d')`):** returns a `DOMProxy` wrapping a JavaScript `Proxy` over the overlay `CanvasRenderingContext2D`. All standard Canvas2D methods and properties work via the generic `_via_call`/`_via_set` bridge ops. `ctx.clear()` is a custom method added by the Proxy that clears the full overlay canvas. The overlay is DPR-scaled and resizes with the BabylonJS canvas.

**BabylonJS:** loaded via `@babylonjs/core` npm package, dynamically imported inside `create_scene` so it only loads when a notebook actually uses `scene3d` (~1.6 MB gzipped, separate lazy chunk).

**Naming discipline:** `scene3d.py` uses `_s3d_decode` and `_s3d_call` (not `_decode`/`_call`) to avoid clobbering the shared Pyodide globals defined by `cv.py` and `graphics.py`. All modules share the same Python global namespace. New modules must use unique prefixes for any helper functions.

### Branches

- `main` — web app (Vite + Vue + Vuetify, IndexedDB storage)
- `tauri-native` — in-progress conversion to a native Tauri app with filesystem-based storage

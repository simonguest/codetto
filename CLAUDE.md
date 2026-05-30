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
- `markdown` — rendered markdown via `marked`
- `video` — video player via `video.js`; triggered by `raw` cells tagged with `"video"` in `cell.metadata.tags`; cell source is a JSON payload `{ "url": "...", "controls": true }`
- `chat` — LLM chat interface
- `journal` — student-editable note cell; triggered by `markdown` cells tagged with `"journal"` in `cell.metadata.tags`; double-click (or click the pencil icon) to enter edit mode, Close to save. See `docs/cell-types/journal.md`.

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

### Branches

- `main` — web app (Vite + Vue + Vuetify, IndexedDB storage)
- `tauri-native` — in-progress conversion to a native Tauri app with filesystem-based storage

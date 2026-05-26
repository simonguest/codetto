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

### Key selectors

- **Run button** — `page.getByRole('button', { name: 'Run code' })`; disabled while Pyodide is initialising, enabled when ready
- **stdout output** — `page.locator('textarea.output-console')`
- **Pyodide ready** — inferred from the run button becoming enabled (no direct DOM indicator)

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

### Branches

- `main` — web app (Vite + Vue + Vuetify, IndexedDB storage)
- `tauri-native` — in-progress conversion to a native Tauri app with filesystem-based storage

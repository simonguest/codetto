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
```

There are no tests in this project.

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

### Notebook metadata extensions

**Title** — `notebook.metadata.title` sets a friendly display name; falls back to filename if absent.

**Globals** — `notebook.metadata.globals` defines named values substituted at runtime using `{{VARIABLE}}` syntax in markdown and code cells. Each global can have a `"default"` and per-locale overrides (e.g. `"hi-IN"`, `"ja-JP"`).

**Form fields** — Code cells support Google Colab-compatible `#@param` annotations for interactive widgets: plain values, sliders (`type:"slider"` with `min`/`max`/`step`), dropdowns (array of values), and booleans (`type:"boolean"`).

### i18n

Locale strings live in `src/i18n/labels/`. The active locale is stored in `settingsStore.locale`. Cell source can have per-locale overrides in `cell.metadata.i18n[locale]` — when the locale matches, the renderer replaces the cell source with the localized content. This is recommended for markdown cells only; using it on code cells risks overwriting student-edited code on locale change. Global substitution (`{{VARIABLE}}`) also resolves per locale.

### Pyodide specifics

- Pyodide assets must be present at `public/pyodide/` (not committed; must be downloaded separately).
- The worker requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers — these are set in `vite.config.mjs` for both dev and preview.
- `SharedArrayBuffer` is used for interrupt support when available; the worker gracefully degrades without it.
- `python_init.py` sets up stdout overrides and async `input()` transforms on worker startup. `python_reset_globals.py` clears Python globals between notebook loads.

### Branches

- `main` — web app (Vite + Vue + Vuetify, IndexedDB storage)
- `tauri-native` — in-progress conversion to a native Tauri app with filesystem-based storage

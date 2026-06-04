/// <reference lib="webworker" />

let pyodide: any;

const JEDI_INIT = `
import jedi
import json

def _get_docstring(c):
    try:
        doc = c.docstring(raw=True)
        if not doc:
            return ''
        first_para = doc.split('\\n\\n')[0].strip()
        return ' '.join(first_para.split())[:200]
    except Exception:
        return ''

def _get_completions(source, line, column):
    try:
        script = jedi.Script(source)
        completions = script.complete(line, column)
        return json.dumps([
            {
                'name': c.name,
                'type': c.type,
                'prefixLen': len(c.name) - len(c.complete),
                'docstring': _get_docstring(c),
            }
            for c in completions
        ])
    except Exception:
        return '[]'
`;

async function initialize() {
  // @ts-ignore
  if (import.meta.env.DEV) {
    const { loadPyodide } = await import(
      new URL(/* @vite-ignore */ "/pyodide/pyodide.mjs", import.meta.url).toString()
    );
    pyodide = await loadPyodide();
  } else {
    const { loadPyodide } = await import(
      new URL(/* @vite-ignore */ "../pyodide/pyodide.mjs", import.meta.url).toString()
    );
    pyodide = await loadPyodide();
  }

  await pyodide.loadPackage(["jedi", "parso"]);

  pyodide.FS.mkdirTree("/stubs");
  for (const [module, path] of [
    ["cv", "./cv/cv.pyi"],
    ["audio", "./audio/audio.pyi"],
    ["graphics", "./graphics/graphics.pyi"],
  ]) {
    const res = await fetch(new URL(path, import.meta.url));
    pyodide.FS.writeFile(`/stubs/${module}.pyi`, await res.text());
  }
  await pyodide.runPythonAsync(`import sys\nif '/stubs' not in sys.path: sys.path.insert(0, '/stubs')`);

  await pyodide.runPythonAsync(JEDI_INIT);
}

// All Pyodide operations must be serialized — concurrent access causes silent failures.
// Every task is chained onto this promise so they execute one at a time.
let taskChain: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): void {
  taskChain = taskChain.then(task).catch(() => {});
}

self.onmessage = (event: MessageEvent) => {
  const { type, ...data } = event.data;

  switch (type) {
    case "initialize":
      enqueue(async () => {
        try {
          await initialize();
          self.postMessage({ type: "initialized" });
        } catch (error) {
          console.error("JediWorker: Initialization failed:", error);
          self.postMessage({ type: "error", error: String(error) });
        }
      });
      break;

    case "sync_packages":
      enqueue(async () => {
        try {
          if (pyodide && data.code) {
            await pyodide.loadPackagesFromImports(data.code);
          }
        } catch (error) {
          console.warn("JediWorker: Failed to sync packages:", error);
        }
      });
      break;

    case "complete":
      // Task 1: run Jedi with whatever is already loaded and respond immediately
      enqueue(async () => {
        if (!pyodide) {
          self.postMessage({ type: "completions", requestId: data.requestId, completions: [] });
          return;
        }
        let json = "[]";
        try {
          json = await pyodide.runPythonAsync(
            `_get_completions(${JSON.stringify(data.script)}, ${data.line}, ${data.column})`
          );
        } catch { }
        self.postMessage({ type: "completions", requestId: data.requestId, completions: JSON.parse(json) });
      });
      // Task 2: load any missing packages so the next request is richer
      enqueue(async () => {
        try {
          if (pyodide) await pyodide.loadPackagesFromImports(data.script);
        } catch { }
      });
      break;
  }
};

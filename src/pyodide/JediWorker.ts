/// <reference lib="webworker" />

let pyodide: any;

const JEDI_INIT = `
import jedi
import json

def _get_completions(source, line, column):
    try:
        script = jedi.Script(source)
        completions = script.complete(line, column)
        return json.dumps([
            {'name': c.name, 'type': c.type, 'prefixLen': len(c.name) - len(c.complete)}
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
  await pyodide.runPythonAsync(JEDI_INIT);
}

self.onmessage = async (event: MessageEvent) => {
  const { type, ...data } = event.data;

  switch (type) {
    case "initialize":
      try {
        await initialize();
        self.postMessage({ type: "initialized" });
      } catch (error) {
        console.error("JediWorker: Initialization failed:", error);
        self.postMessage({ type: "error", error: String(error) });
      }
      break;

    case "sync_packages":
      try {
        if (pyodide && data.code) {
          await pyodide.loadPackagesFromImports(data.code);
        }
      } catch (error) {
        // Silent — don't surface package load failures to the student
        console.warn("JediWorker: Failed to sync packages:", error);
      }
      break;

    case "complete":
      try {
        if (!pyodide) {
          self.postMessage({ type: "completions", requestId: data.requestId, completions: [] });
          break;
        }
        // Load any packages referenced in the script so Jedi can infer types
        try {
          await pyodide.loadPackagesFromImports(data.script);
        } catch {
          // Ignore — Jedi may still provide partial completions
        }
        const json = await pyodide.runPythonAsync(
          `_get_completions(${JSON.stringify(data.script)}, ${data.line}, ${data.column})`
        );
        self.postMessage({ type: "completions", requestId: data.requestId, completions: JSON.parse(json) });
      } catch (error) {
        self.postMessage({ type: "completions", requestId: data.requestId, completions: [] });
      }
      break;
  }
};

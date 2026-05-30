/// <reference lib="webworker" />

import { additionalPackagesFromCode } from "./additionalPackagesFromCode";
import { overrides, implementOverride } from "./overrides/implementOverride";
import { initializeCv, reloadCvPython } from "./cv/worker";

let pyodide: any;
let interruptBuffer: Int32Array | null = null;
let appliedEnvVarNames = new Set<string>();
const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";

// via.js bridge — SharedArrayBuffers for synchronous worker↔main DOM calls
let viaSignal: Int32Array | null = null;   // [0]=ready flag, [1]=data byte length
let viaData: Uint8Array | null = null;
const viaDecoder = new TextDecoder();

function viaSync(command: object): string {
  self.postMessage({ type: "via", command });
  Atomics.wait(viaSignal!, 0, 0);          // block until main thread sets [0] to 1
  const len = Atomics.load(viaSignal!, 1);
  const json = viaDecoder.decode(viaData!.slice(0, len)); // slice() copies out of SAB
  Atomics.store(viaSignal!, 0, 0);         // reset for next call
  return json;
}

async function runPythonFile(url: URL) {
  const response = await fetch(url);
  const code = await response.text();
  return await pyodide.runPythonAsync(code);
}

async function initialize() {
  console.log("PyodideWorker: Starting Pyodide initialization...");

  // @ts-ignore
  if (import.meta.env.DEV) {
    // Local dev server
    const { loadPyodide } = await import(
      new URL(/* @vite-ignore */ "/pyodide/pyodide.mjs", import.meta.url).toString()
    );
    pyodide = await loadPyodide();
  } else {
    // Production
    const { loadPyodide } = await import(
      new URL(/* @vite-ignore */ "../pyodide/pyodide.mjs", import.meta.url).toString()
    );
    pyodide = await loadPyodide();
  }

  console.log("PyodideWorker: Checking for interrupt buffer");
  if (hasSharedArrayBuffer) {
    const buffer = new SharedArrayBuffer(4);
    interruptBuffer = new Int32Array(buffer);
    pyodide.setInterruptBuffer(interruptBuffer);
    pyodide.globals.set("_interrupt_buffer", interruptBuffer);
    console.log("PyodideWorker: Interrupt buffer created");
  } else {
    console.warn(
      "PyodideWorker: SharedArrayBuffer is not available, interrupt functionality will be disabled"
    );
  }

  // Override stdout
  console.log("PyodideWorker: Creating override for stdout");
  pyodide.globals.set("_override_stdout", {
    write: (text: string) => {
      self.postMessage({ type: "stdout", text });
      return text.length;
    },
    flush: () => {
      /* no-op */
    },
  });

  // Override input
  console.log("PyodideWorker: Overriding input calls with async equivalent");
  await runPythonFile(new URL("./async_input.py", import.meta.url));

  console.log("PyodideWorker: Creating override for input");
  pyodide.globals.set("_override_input", (prompt?: string) => {
    return new Promise(resolve => {
      self.postMessage({
        type: "input_request",
        message: prompt || "",
      });

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === "input_response") {
          self.removeEventListener("message", messageHandler);
          resolve(event.data.value);
        }
      };

      self.addEventListener("message", messageHandler);
    });
  });

  // Override base64 image updates
  console.log("PyodideWorker: Creating override for js functions");
  pyodide.globals.set("js", {
    imageBase64: (image_base64: string) => {
      self.postMessage({ type: "execute_result", result: { "image/png": image_base64 } });
    },
    imageSvg: (svg: string) => {
      self.postMessage({ type: "execute_result", result: { "image/svg+xml": svg } });
    },
    displayHtml: (html: string) => {
      self.postMessage({ type: "execute_result", result: { "text/html": html } });
    },
  });

  // via.js bridge setup
  if (hasSharedArrayBuffer) {
    console.log("PyodideWorker: Setting up via.js bridge");
    const viaSignalSAB = new SharedArrayBuffer(8);  // two Int32 slots
    const viaDataSAB = new SharedArrayBuffer(65536); // 64 KB result buffer
    viaSignal = new Int32Array(viaSignalSAB);
    viaData = new Uint8Array(viaDataSAB);
    self.postMessage({ type: "via_init", viaSignalSAB, viaDataSAB });

    // Synchronous DOM method call: _via_call(handle, "methodName", [args]) → JSON string
    pyodide.globals.set("_via_call", (handle: number, method: string, pyArgs: any) => {
      const args = pyArgs?.toJs ? pyArgs.toJs({ dict_converter: Object.fromEntries }) : [];
      return viaSync({ op: "call", handle, method, args });
    });

    // Synchronous DOM property set: _via_set(handle, "propName", value)
    pyodide.globals.set("_via_set", (handle: number, prop: string, value: any) => {
      viaSync({ op: "set", handle, prop, value });
    });

  }

  console.log("PyodideWorker: Initializing Python environment");
  await runPythonFile(new URL("./python_init.py", import.meta.url));

  await initializeCv(pyodide, hasSharedArrayBuffer ? viaSync : null, runPythonFile);
}

self.onmessage = async event => {
  const { type, ...data } = event.data;

  switch (type) {
    case "initialize":
      try {
        await initialize();
        self.postMessage({
          type: "initialized",
          interruptBuffer: interruptBuffer ? interruptBuffer.buffer : null,
          hasInterrupt: hasSharedArrayBuffer,
          pyodideVersion: pyodide.version,
        });
      } catch (error) {
        console.error("PyodideWorker: Failed to initialize Pyodide:", error);
        self.postMessage({ type: "fatal", error: String(error) });
      }
      break;
    case "reset":
      console.log("Resetting Pyodide Globals");
      await runPythonFile(new URL("./python_reset_globals.py", import.meta.url));
      await reloadCvPython(runPythonFile);
      self.postMessage({
        type: "reset_completed"
      });
      break;
    case "set_env_vars":
      if (pyodide && data.envVars) {
        try {
          const current = data.envVars as Record<string, string>;
          const currentNames = new Set(Object.keys(current));
          const toRemove = [...appliedEnvVarNames].filter(k => !currentNames.has(k));
          const lines = ["import os"];
          for (const k of toRemove) {
            lines.push(`os.environ.pop(${JSON.stringify(k)}, None)`);
          }
          for (const [k, v] of Object.entries(current)) {
            lines.push(`os.environ[${JSON.stringify(k)}] = ${JSON.stringify(v)}`);
          }
          await pyodide.runPythonAsync(lines.join("\n"));
          appliedEnvVarNames = currentNames;
          console.log(`PyodideWorker: Applied ${currentNames.size} env var(s), removed ${toRemove.length}`);
        } catch (e) {
          console.error("PyodideWorker: Failed to set env vars:", e);
        }
      }
      break;
    case "run":
      const code = data.code;
      const cellId = data.cellId;
      try {
        if (pyodide) {
          console.log("PyodideProvider: Loading packages from imports");
          const basePackages = await pyodide.loadPackagesFromImports(code);
          console.log("PyodideProvider: Loading additional packages from code");
          const additionalPackages = await pyodide.loadPackage(additionalPackagesFromCode(code));

          console.log("PyodideProvider: Searching for overrides");
          for (const loadedPackage of [...basePackages, ...additionalPackages]) {
            const override = overrides.find(config => config.module === loadedPackage.name);
            if (override) {
              console.log(`PyodideProvider: Implementing override for ${loadedPackage.name}`);
              await implementOverride(pyodide, loadedPackage.name);
            }
          }

          // Transform the code first
          console.log(`PyodideProvider: Transforming code to support async inputs`);
          const transformedCode = await pyodide.runPythonAsync(
            `_transform_code(${JSON.stringify(code)})`
          );

          // Run the cell code
          console.log(`PyodideProvider: Running cell ${cellId}`);
          const result = await pyodide.runPythonAsync(`${transformedCode}`);
          console.log("PyodideProvider: Returning result");
          if (result) {
            if (typeof result == "object") {
              // Add result representations, if they exist
              if ("_repr_svg_" in result) {
                self.postMessage({
                  type: "execute_result",
                  result: { "image/svg+xml": result._repr_svg_() },
                });
              }
              if ("_repr_html_" in result) {
                self.postMessage({
                  type: "execute_result",
                  result: { "text/html": result._repr_html_() },
                });
              }
              if ("_repr_png_" in result) {
                self.postMessage({
                  type: "execute_result",
                  result: { "image/png": result._repr_png_() },
                });
              }
              // Add the default result representation
              self.postMessage({
                type: "execute_result",
                result: { "text/plain": result.__repr__() },
              });
            } else {
              // The result is not an object. Just pass the result back as a string.
              self.postMessage({
                type: "execute_result",
                result: { "text/plain": result.toString() },
              });
            }
          }
          self.postMessage({ type: "execute_completed" });
        }
      } catch (error) {
        console.error(error);
        self.postMessage({ type: "error", error: String(error) });
      }
      break;
  }
};

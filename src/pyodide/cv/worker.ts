/**
 * CV module — worker-side initialisation.
 *
 * Registers the Python globals that proxy cv operations through the via.js
 * bridge, then loads cv.py into the Pyodide environment.
 *
 * Called from PyodideWorker.ts after python_init.py has been loaded.
 * viaSync is null when SharedArrayBuffer is unavailable; in that case the
 * globals are skipped and cv will not function.
 */
export async function initializeCv(
  pyodide: any,
  viaSync: ((command: object) => string) | null,
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  if (viaSync) {
    pyodide.globals.set("_cv_create_canvas", (width: number, height: number) =>
      viaSync({ op: "create_canvas", width, height })
    );
    pyodide.globals.set("_cv_start_camera", (canvasHandle: number) =>
      viaSync({ op: "create_camera", handle: canvasHandle })
    );
    pyodide.globals.set("_cv_start_detector", (cameraHandle: number) =>
      viaSync({ op: "create_detector", handle: cameraHandle })
    );
  }

  console.log("PyodideWorker: Loading cv module");
  await runPythonFile(new URL("./cv.py", import.meta.url));
}

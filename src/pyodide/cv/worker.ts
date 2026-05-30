/**
 * CV module — worker-side initialisation.
 *
 * initializeCv: called once at startup. Registers the JS globals that proxy
 * cv operations through the via.js bridge, then loads cv.py.
 *
 * reloadCvPython: called after every Pyodide globals reset. python_reset_globals.py
 * deletes non-underscore-prefixed names (including cv.py's `import json`), so
 * cv.py must be re-run to restore those bindings before student code can run.
 *
 * viaSync is null when SharedArrayBuffer is unavailable; in that case the
 * JS globals are skipped and cv will not function.
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
    pyodide.globals.set("_cv_start_face_detector", (cameraHandle: number) =>
      viaSync({ op: "create_face_detector", handle: cameraHandle })
    );
    pyodide.globals.set("_cv_start_object_detector", (cameraHandle: number, delegate: string) =>
      viaSync({ op: "create_object_detector", handle: cameraHandle, delegate })
    );
  }

  await reloadCvPython(runPythonFile);
}

export async function reloadCvPython(
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  console.log("PyodideWorker: Loading cv module");
  await runPythonFile(new URL("./cv.py", import.meta.url));
}

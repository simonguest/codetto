/**
 * scene3d module — worker-side initialisation.
 *
 * initializeScene3d: called once at startup. Registers JS globals that proxy
 * scene3d operations through the via.js bridge, then loads scene3d.py.
 *
 * reloadScene3dPython: called after every Pyodide globals reset.
 *
 * Two bridge functions are registered:
 *   _scene3d_call(commandJson)      — regular viaSync (blocks until response)
 *   _scene3d_wait_event(sceneHandle)— viaSyncTimed(250ms) so run()'s event
 *                                     loop can be interrupted via KeyboardInterrupt
 */
export async function initializeScene3d(
  pyodide: any,
  viaSync: ((command: object) => string) | null,
  viaSyncTimed: ((command: object, timeout: number) => string) | null,
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  if (viaSync && viaSyncTimed) {
    pyodide.globals.set("_scene3d_call", (commandJson: string) =>
      viaSync({ op: "scene3d", ...JSON.parse(commandJson) })
    );
    pyodide.globals.set("_scene3d_wait_event", (sceneHandle: number) =>
      viaSyncTimed({ op: "scene3d_wait_event", scene: sceneHandle }, 250)
    );
  }
  await reloadScene3dPython(runPythonFile);
}

export async function reloadScene3dPython(
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  console.log("PyodideWorker: Loading scene3d module");
  await runPythonFile(new URL("./scene3d.py", import.meta.url));
}

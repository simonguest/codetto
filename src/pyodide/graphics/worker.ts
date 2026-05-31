/**
 * Graphics module — worker-side initialisation.
 *
 * initializeGraphics: called once at startup. Registers the JS globals that
 * proxy graphics operations through the via.js bridge, then loads graphics.py.
 *
 * reloadGraphicsPython: called after every Pyodide globals reset, for the same
 * reason as reloadCvPython — python_reset_globals.py clears non-underscore
 * names so the module must be re-registered.
 */
export async function initializeGraphics(
  pyodide: any,
  viaSync: ((command: object) => string) | null,
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  if (viaSync) {
    pyodide.globals.set("_graphics_create_canvas", (width: number, height: number) =>
      viaSync({ op: "create_canvas", width, height })
    );
    pyodide.globals.set("_graphics_draw_image", (handle: number, dataUrl: string) =>
      viaSync({ op: "draw_image", handle, dataUrl })
    );
  }

  await reloadGraphicsPython(runPythonFile);
}

export async function reloadGraphicsPython(
  runPythonFile: (url: URL) => Promise<any>
): Promise<void> {
  console.log("PyodideWorker: Loading graphics module");
  await runPythonFile(new URL("./graphics.py", import.meta.url));
}

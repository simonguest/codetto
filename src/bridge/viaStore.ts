// Shared registry mapping integer handles to main-thread DOM objects.
// Importable by both PyodideProvider (which populates it) and
// CanvasResult (which reads from it to mount a pre-created canvas).

const objects = new Map<number, any>();
let nextHandle = 1;

export function viaRegister(obj: any): number {
  const handle = nextHandle++;
  objects.set(handle, obj);
  return handle;
}

export function viaGet(handle: number): any {
  return objects.get(handle);
}

export function viaStopAll() {
  for (const obj of objects.values()) {
    if (typeof obj?.stop === "function") {
      try { obj.stop(); } catch (_) {}
    }
  }
}

export function viaClear() {
  objects.clear();
  // Do NOT reset nextHandle — handles must keep incrementing across clears.
  // Resetting to 1 causes saved handle values (from a prior session's cell
  // outputs) to match newly-allocated handles, which prevents CanvasResult's
  // prop-change watch from firing and leaves the canvas un-mounted.
}

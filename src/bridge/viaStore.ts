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

export function viaClear() {
  objects.clear();
  nextHandle = 1;
}

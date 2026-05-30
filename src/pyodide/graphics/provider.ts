/**
 * Graphics module — main-thread (provider) side.
 *
 * Handles the create_canvas via.js op that requires DOM access.
 * Returns true if the op was handled, false otherwise.
 */
import { viaRegister } from "@/bridge/viaStore";
import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";

export async function handleGraphicsOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  if (op === "create_canvas") {
    const { width, height } = command;

    // Auto-size: fill the available output cell width at a 4:3 aspect ratio.
    const el = (document.querySelector(".v-main") ?? document.body) as HTMLElement;
    const availableWidth = Math.max(320, el.clientWidth - 32);
    const lw = width || Math.min(availableWidth, 1280);
    const lh = height || Math.round(lw * 3 / 4);

    // Scale the backing buffer for HiDPI/Retina displays.
    const dpr = window.devicePixelRatio || 1;
    const canvasEl = document.createElement("canvas");
    canvasEl.width = lw * dpr;
    canvasEl.height = lh * dpr;
    canvasEl.style.width = `${lw}px`;

    // Register the raw element separately so CanvasResult can append it to the DOM.
    const displayHandle = viaRegister(canvasEl);
    if (pyodideStore.runningCellId) {
      notebookStore.setResult(pyodideStore.runningCellId, {
        "application/x-via-canvas": String(displayHandle),
      });
    }

    // Canvas controller: the object Python holds. Owns overlay state and exposes
    // drawing methods. _overlayFn is called inside the rAF tick after ctx.scale(dpr, dpr).
    // Draw bounding boxes at logical pixel coordinates. Used both for direct
    // drawing and as the rAF overlay (where the camera has already applied scale).
    function drawBoxes(ctx: CanvasRenderingContext2D, detections: any[]) {
      if (!detections?.length) return;
      const fontSize = Math.max(14, Math.round(lw / 40));
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = Math.max(2, Math.round(lw / 320));
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = "#00ff00";
      for (const det of detections) {
        ctx.strokeRect(det.x, det.y, det.w, det.h);
        const pct = `${Math.round(det.confidence * 100)}%`;
        const label = det.type ? `${det.type} ${pct}` : pct;
        ctx.fillText(label, det.x + 4, det.y - 6);
      }
    }

    let scaledCtx: CanvasRenderingContext2D | null = null;
    const canvasController = {
      _canvas: canvasEl,
      _logicalWidth: lw,
      _logicalHeight: lh,
      _dpr: dpr,
      _overlayFn: null as (() => void) | null,
      // Returns a pre-scaled 2D context so student coordinates are in logical pixels.
      // The DPR scale is applied once and cached; the same context object is returned
      // on repeated calls so the transform is never double-applied.
      getContext(_type: string) {
        if (!scaledCtx) {
          scaledCtx = canvasEl.getContext("2d")!;
          scaledCtx.scale(dpr, dpr);
        }
        return scaledCtx;
      },
      // Clears the entire canvas. Useful between detection frames when no camera
      // is driving the render loop.
      clear() {
        const ctx = canvasEl.getContext("2d")!;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        ctx.restore();
      },
      drawBoundingBoxes(detections: any[]) {
        // Draw immediately so boxes appear even when no camera drives the rAF loop.
        // setTransform sets an exact DPR scale regardless of any prior getContext call.
        const ctx = canvasEl.getContext("2d")!;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawBoxes(ctx, detections);
        ctx.restore();
        // Also update the overlay so the camera rAF redraws boxes on top of each
        // new video frame (the rAF tick has already applied scale when this runs).
        canvasController._overlayFn = !detections?.length ? null : () =>
          drawBoxes(canvasEl.getContext("2d")!, detections);
      },
    };
    viaRespond({ type: "handle", id: viaRegister(canvasController) });
    return true;
  }

  return false;
}

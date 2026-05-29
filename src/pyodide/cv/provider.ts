/**
 * CV module — main-thread (provider) side.
 *
 * Handles the via.js ops that require DOM access: create_canvas,
 * create_camera, and create_detector. Returns true if the op was handled
 * (so PyodideProvider can break out of its switch), false otherwise.
 */
import { viaRegister, viaGet } from "@/bridge/viaStore";
import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";

export async function handleCvOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  const { handle, width, height } = command;

  if (op === "create_canvas") {
    const canvasEl = document.createElement("canvas");
    canvasEl.width = width;
    canvasEl.height = height;
    // Register the raw element separately so CanvasResult can append it to the DOM.
    const displayHandle = viaRegister(canvasEl);
    if (pyodideStore.runningCellId) {
      notebookStore.setResult(pyodideStore.runningCellId, {
        "application/x-via-canvas": String(displayHandle),
      });
    }
    // Canvas controller: the object Python holds. Owns overlay state and exposes
    // drawing methods so student code calls canvas.draw_bounding_boxes(), not camera.
    const canvasController = {
      _canvas: canvasEl,
      _overlayFn: null as (() => void) | null,
      drawBoundingBoxes(faces: any[]) {
        canvasController._overlayFn = !faces?.length ? null : () => {
          const ctx = canvasEl.getContext("2d")!;
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "#00ff00";
          for (const face of faces) {
            ctx.strokeRect(face.x, face.y, face.w, face.h);
            ctx.fillText(`${Math.round(face.confidence * 100)}%`, face.x + 4, face.y - 6);
          }
        };
      },
    };
    viaRespond({ type: "handle", id: viaRegister(canvasController) });
    return true;
  }

  if (op === "create_camera") {
    const canvasController = viaGet(handle);
    if (!canvasController?._canvas) {
      viaRespond({ type: "error", message: "Invalid canvas handle" });
      return true;
    }
    const canvasEl = canvasController._canvas;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const ctx = canvasEl.getContext("2d");
      let rafId: number;
      const tick = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          ctx.drawImage(video, 0, 0, canvasEl.width, canvasEl.height);
          canvasController._overlayFn?.();
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      const controller = {
        _video: video,
        clearOverlay() { canvasController._overlayFn = null; },
        stop() {
          cancelAnimationFrame(rafId);
          stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          video.srcObject = null;
        },
      };
      viaRespond({ type: "handle", id: viaRegister(controller) });
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  if (op === "create_detector") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    try {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "/mediapipe/models/face_detector.tflite",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.5,
      });
      // Detection runs on-demand when Python calls get_detections(), not in a
      // background interval — avoids blocking the main thread's message loop.
      const controller = {
        getDetections() {
          const video = camera._video;
          if (video.readyState < video.HAVE_CURRENT_DATA) return [];
          try {
            const result = faceDetector.detectForVideo(video, performance.now());
            return (result.detections ?? []).map((d: any) => ({
              x: Math.round(d.boundingBox?.originX ?? 0),
              y: Math.round(d.boundingBox?.originY ?? 0),
              w: Math.round(d.boundingBox?.width ?? 0),
              h: Math.round(d.boundingBox?.height ?? 0),
              confidence: Math.round((d.categories?.[0]?.score ?? 0) * 100) / 100,
            }));
          } catch (_) { return []; }
        },
        stop() { faceDetector.close(); camera.clearOverlay(); },
      };
      viaRespond({ type: "handle", id: viaRegister(controller) });
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  return false;
}

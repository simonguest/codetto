/**
 * CV module — main-thread (provider) side.
 *
 * Handles the via.js ops that require DOM access: create_canvas,
 * create_camera, create_face_detector, and create_object_detector.
 * Returns true if the op was handled (so PyodideProvider can break out of
 * its switch), false otherwise.
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
    // Scale the backing buffer for HiDPI/Retina displays so the canvas is
    // sharp. CSS width/height stays at logical pixels; everything that draws
    // into the canvas (video frames and overlays) uses ctx.scale(dpr, dpr)
    // so all coordinates stay in logical pixel space.
    const dpr = window.devicePixelRatio || 1;
    const canvasEl = document.createElement("canvas");
    canvasEl.width = width * dpr;
    canvasEl.height = height * dpr;
    canvasEl.style.width = `${width}px`;
    canvasEl.style.height = `${height}px`;

    // Register the raw element separately so CanvasResult can append it to the DOM.
    const displayHandle = viaRegister(canvasEl);
    if (pyodideStore.runningCellId) {
      notebookStore.setResult(pyodideStore.runningCellId, {
        "application/x-via-canvas": String(displayHandle),
      });
    }
    // Canvas controller: the object Python holds. Owns overlay state and exposes
    // drawing methods so student code calls canvas.draw_bounding_boxes(), not camera.
    // _overlayFn is called inside the rAF tick after ctx.scale(dpr, dpr), so all
    // coordinates passed to it are in logical pixel space.
    const canvasController = {
      _canvas: canvasEl,
      _logicalWidth: width,
      _logicalHeight: height,
      _dpr: dpr,
      _overlayFn: null as (() => void) | null,
      drawBoundingBoxes(detections: any[]) {
        canvasController._overlayFn = !detections?.length ? null : () => {
          const ctx = canvasEl.getContext("2d")!;
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;
          ctx.font = "14px sans-serif";
          ctx.fillStyle = "#00ff00";
          for (const det of detections) {
            ctx.strokeRect(det.x, det.y, det.w, det.h);
            const pct = `${Math.round(det.confidence * 100)}%`;
            const label = det.type ? `${det.type} ${pct}` : pct;
            ctx.fillText(label, det.x + 4, det.y - 6);
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
    const { _canvas: canvasEl, _logicalWidth: lw, _logicalHeight: lh, _dpr: dpr } = canvasController;
    const ctx = canvasEl.getContext("2d")!;
    try {
      // Request the stream at the canvas's logical size to avoid unnecessary
      // upscaling from a low-res stream.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: lw }, height: { ideal: lh } },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      let rafId: number;
      const tick = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          // Scale the context so both the video frame and any overlay draw in
          // logical pixel coordinates, letting the DPR-scaled backing buffer
          // produce a sharp image on HiDPI displays.
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.drawImage(video, 0, 0, lw, lh);
          canvasController._overlayFn?.();
          ctx.restore();
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      const controller = {
        _video: video,
        _logicalWidth: lw,
        _logicalHeight: lh,
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

  if (op === "create_face_detector") {
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
      const controller = {
        getDetections() {
          const video = camera._video;
          if (video.readyState < video.HAVE_CURRENT_DATA) return [];
          try {
            const result = faceDetector.detectForVideo(video, performance.now());
            // MediaPipe coords are in video native resolution; scale to logical canvas pixels.
            const scaleX = camera._logicalWidth / (video.videoWidth || camera._logicalWidth);
            const scaleY = camera._logicalHeight / (video.videoHeight || camera._logicalHeight);
            return (result.detections ?? []).map((d: any) => ({
              type: "face",
              x: Math.round((d.boundingBox?.originX ?? 0) * scaleX),
              y: Math.round((d.boundingBox?.originY ?? 0) * scaleY),
              w: Math.round((d.boundingBox?.width ?? 0) * scaleX),
              h: Math.round((d.boundingBox?.height ?? 0) * scaleY),
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

  if (op === "create_object_detector") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    const requestedDelegate = (command.delegate ?? "CPU") as "CPU" | "GPU";
    try {
      const { ObjectDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const modelAssetPath = "/mediapipe/models/efficientdet_lite0.tflite";

      let objectDetector: any;
      let warning: string | undefined;

      try {
        objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath, delegate: requestedDelegate },
          runningMode: "VIDEO",
          maxResults: 10,
          scoreThreshold: 0.5,
        });
      } catch (_) {
        if (requestedDelegate === "GPU") {
          warning = "GPU delegate unavailable, falling back to CPU";
          objectDetector = await ObjectDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath, delegate: "CPU" },
            runningMode: "VIDEO",
            maxResults: 10,
            scoreThreshold: 0.5,
          });
        } else {
          throw _;
        }
      }

      const controller = {
        getDetections() {
          const video = camera._video;
          if (video.readyState < video.HAVE_CURRENT_DATA) return [];
          try {
            const result = objectDetector.detectForVideo(video, performance.now());
            // MediaPipe coords are in video native resolution; scale to logical canvas pixels.
            const scaleX = camera._logicalWidth / (video.videoWidth || camera._logicalWidth);
            const scaleY = camera._logicalHeight / (video.videoHeight || camera._logicalHeight);
            return (result.detections ?? []).map((d: any) => ({
              type: d.categories?.[0]?.categoryName ?? "object",
              x: Math.round((d.boundingBox?.originX ?? 0) * scaleX),
              y: Math.round((d.boundingBox?.originY ?? 0) * scaleY),
              w: Math.round((d.boundingBox?.width ?? 0) * scaleX),
              h: Math.round((d.boundingBox?.height ?? 0) * scaleY),
              confidence: Math.round((d.categories?.[0]?.score ?? 0) * 100) / 100,
            }));
          } catch (_) { return []; }
        },
        stop() { objectDetector.close(); camera.clearOverlay(); },
      };

      const response: any = { type: "handle", id: viaRegister(controller) };
      if (warning) response.warning = warning;
      viaRespond(response);
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  return false;
}

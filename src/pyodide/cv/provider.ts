/**
 * CV module — main-thread (provider) side.
 *
 * Handles the via.js ops that require DOM access: create_camera,
 * create_face_detector, and create_object_detector.
 * Returns true if the op was handled (so PyodideProvider can break out of
 * its switch), false otherwise.
 */
import { viaRegister, viaGet } from "@/bridge/viaStore";

export async function handleCvOp(
  op: string,
  command: any,
  viaRespond: (result: any) => void
): Promise<boolean> {
  const { handle } = command;

  if (op === "create_camera") {
    // handle is null when Python called start_camera() with no canvas argument.
    const canvasController = handle != null ? viaGet(handle) : null;
    if (handle != null && !canvasController?._canvas) {
      viaRespond({ type: "error", message: "Invalid canvas handle" });
      return true;
    }
    const canvasEl = canvasController?._canvas ?? null;
    const dpr = canvasController?._dpr ?? 1;
    const ctx = canvasEl ? canvasEl.getContext("2d")! : null;
    // Ideal stream dimensions: use canvas logical size if available, else 640×480.
    const requestW = canvasController?._logicalWidth ?? 640;
    const requestH = canvasController?._logicalHeight ?? 480;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: requestW }, height: { ideal: requestH } },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      // Logical dimensions for coordinate scaling in detectors.
      // Canvas supplies exact logical pixels; headless cameras use the actual
      // video stream dimensions (available after play() resolves).
      const lw = canvasController?._logicalWidth ?? (video.videoWidth || requestW);
      const lh = canvasController?._logicalHeight ?? (video.videoHeight || requestH);
      // Mutable slot detectors can write to in order to receive each rAF frame.
      const cameraRef = { onFrame: null as ((video: HTMLVideoElement) => void) | null };
      let rafId: number;
      const tick = () => {
        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          if (ctx) {
            ctx.save();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.drawImage(video, 0, 0, lw, lh);
            canvasController!._overlayFn?.();
            ctx.restore();
          }
          cameraRef.onFrame?.(video);
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
      const controller = {
        _video: video,
        _logicalWidth: lw,
        _logicalHeight: lh,
        _cameraRef: cameraRef,
        clearOverlay() {
          if (canvasController) canvasController._overlayFn = null;
        },
        stop() {
          cancelAnimationFrame(rafId);
          cameraRef.onFrame = null;
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
      // Spawn the dedicated inference worker. All MediaPipe CPU work happens
      // there so the main thread's rAF loop is never blocked.
      const worker = new Worker(
        new URL("./objectDetectionWorker.ts", import.meta.url),
        { type: "module" }
      );

      // Wait for the model to load before responding to Python.
      // onerror ensures the Promise rejects immediately if the worker fails to
      // start, rather than hanging Atomics.wait in the Pyodide worker forever.
      const { warning } = await new Promise<{ warning?: string }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === "ready") resolve({ warning: e.data.warning });
          else if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.onerror = (e: ErrorEvent) => reject(new Error(e.message ?? "Object detection worker failed"));
        worker.postMessage({
          type: "init",
          modelPath: "/mediapipe/models/efficientdet_lite0.tflite",
          delegate: requestedDelegate,
        });
      });

      let cachedDetections: any[] = [];
      let workerBusy = false;

      // Scale raw MediaPipe coords (video native resolution) to logical canvas pixels.
      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type !== "result") return;
        const video = camera._video;
        const scaleX = camera._logicalWidth / (video.videoWidth || camera._logicalWidth);
        const scaleY = camera._logicalHeight / (video.videoHeight || camera._logicalHeight);
        cachedDetections = (e.data.detections as any[]).map((d: any) => ({
          type: d.categories?.[0]?.categoryName ?? "object",
          x: Math.round((d.boundingBox?.originX ?? 0) * scaleX),
          y: Math.round((d.boundingBox?.originY ?? 0) * scaleY),
          w: Math.round((d.boundingBox?.width ?? 0) * scaleX),
          h: Math.round((d.boundingBox?.height ?? 0) * scaleY),
          confidence: Math.round((d.categories?.[0]?.score ?? 0) * 100) / 100,
        }));
        workerBusy = false;
      };

      // Hook into the camera's rAF. Each frame is captured as a zero-copy
      // ImageBitmap and transferred to the worker. workerBusy ensures we never
      // queue more than one frame — inference runs as fast as the model allows.
      camera._cameraRef.onFrame = (video: HTMLVideoElement) => {
        if (workerBusy) return;
        workerBusy = true;
        createImageBitmap(video).then((bitmap) => {
          worker.postMessage(
            { type: "detect", bitmap, timestamp: performance.now() },
            [bitmap]
          );
        });
      };

      const controller = {
        getDetections() { return cachedDetections; },
        stop() {
          camera._cameraRef.onFrame = null;
          worker.terminate();
          camera.clearOverlay();
        },
      };

      const response: any = { type: "handle", id: viaRegister(controller) };
      if (warning) response.warning = warning;
      viaRespond(response);
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  if (op === "create_pose_detector") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    const requestedDelegate = (command.delegate ?? "CPU") as "CPU" | "GPU";
    const numPoses = command.numPoses ?? 1;
    try {
      const worker = new Worker(
        new URL("./poseLandmarkWorker.ts", import.meta.url),
        { type: "module" }
      );

      const { warning } = await new Promise<{ warning?: string }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === "ready") resolve({ warning: e.data.warning });
          else if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.onerror = (e: ErrorEvent) => reject(new Error(e.message ?? "Pose landmark worker failed"));
        worker.postMessage({
          type: "init",
          modelPath: "/mediapipe/models/pose_landmarker_lite.task",
          delegate: requestedDelegate,
          numPoses,
        });
      });

      let cachedPoses: any[][] = [];
      let workerBusy = false;

      // Scale normalized 0-1 coords to logical canvas pixels.
      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type !== "result") return;
        const lw = camera._logicalWidth;
        const lh = camera._logicalHeight;
        cachedPoses = (e.data.poses as any[][]).map((pose: any[]) =>
          pose.map((lm: any) => ({
            x: Math.round(lm.x * lw),
            y: Math.round(lm.y * lh),
            z: lm.z ?? 0,
            visibility: Math.round((lm.visibility ?? 0) * 100) / 100,
          }))
        );
        workerBusy = false;
      };

      camera._cameraRef.onFrame = (video: HTMLVideoElement) => {
        if (workerBusy) return;
        workerBusy = true;
        createImageBitmap(video).then((bitmap) => {
          worker.postMessage(
            { type: "detect", bitmap, timestamp: performance.now() },
            [bitmap]
          );
        });
      };

      const controller = {
        getDetections() { return cachedPoses; },
        stop() {
          camera._cameraRef.onFrame = null;
          worker.terminate();
          camera.clearOverlay();
        },
      };

      const response: any = { type: "handle", id: viaRegister(controller) };
      if (warning) response.warning = warning;
      viaRespond(response);
    } catch (err) {
      viaRespond({ type: "error", message: String(err) });
    }
    return true;
  }

  if (op === "create_gesture_detector") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    const requestedDelegate = (command.delegate ?? "CPU") as "CPU" | "GPU";
    const numHands = command.numHands ?? 1;
    try {
      const worker = new Worker(
        new URL("./gestureRecognitionWorker.ts", import.meta.url),
        { type: "module" }
      );

      const { warning } = await new Promise<{ warning?: string }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === "ready") resolve({ warning: e.data.warning });
          else if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.onerror = (e: ErrorEvent) => reject(new Error(e.message ?? "Gesture recognition worker failed"));
        worker.postMessage({
          type: "init",
          modelPath: "/mediapipe/models/gesture_recognizer.task",
          delegate: requestedDelegate,
          numHands,
        });
      });

      let cachedHands: any[] = [];
      let workerBusy = false;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type !== "result") return;
        const lw = camera._logicalWidth;
        const lh = camera._logicalHeight;
        cachedHands = (e.data.hands as any[]).map((hand: any) => ({
          gesture: hand.gesture,
          confidence: hand.confidence,
          handedness: hand.handedness,
          landmarks: (hand.landmarks as any[]).map((lm: any) => ({
            x: Math.round(lm.x * lw),
            y: Math.round(lm.y * lh),
            z: lm.z ?? 0,
          })),
        }));
        workerBusy = false;
      };

      camera._cameraRef.onFrame = (video: HTMLVideoElement) => {
        if (workerBusy) return;
        workerBusy = true;
        createImageBitmap(video).then((bitmap) => {
          worker.postMessage(
            { type: "detect", bitmap, timestamp: performance.now() },
            [bitmap]
          );
        });
      };

      const controller = {
        getDetections() { return cachedHands; },
        stop() {
          camera._cameraRef.onFrame = null;
          worker.terminate();
          camera.clearOverlay();
        },
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

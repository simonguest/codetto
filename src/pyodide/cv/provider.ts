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
      // Resize the canvas to match the stream's actual aspect ratio.
      // video.videoWidth/Height are reliable after play() resolves.
      // This corrects the default 4:3 canvas for 16:9, 9:16 (portrait phone), etc.
      const lw = canvasController?._logicalWidth ?? (video.videoWidth || requestW);
      if (canvasController && video.videoWidth && video.videoHeight) {
        const actualLh = Math.round(lw * video.videoHeight / video.videoWidth);
        canvasController._resize(actualLh);
      }
      // Read lh after the resize so detectors and the rAF use the corrected value.
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
    const requestedFaceDelegate = (command.delegate ?? "GPU") as "CPU" | "GPU";
    try {
      const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      const faceOptions = {
        baseOptions: {
          modelAssetPath: "/mediapipe/models/face_detector.tflite",
          delegate: requestedFaceDelegate,
        },
        runningMode: "VIDEO" as const,
        minDetectionConfidence: 0.5,
      };
      let faceDetectorWarning: string | undefined;
      let faceDetector;
      try {
        faceDetector = await FaceDetector.createFromOptions(vision, faceOptions);
      } catch (_) {
        if (requestedFaceDelegate === "GPU") {
          faceDetector = await FaceDetector.createFromOptions(vision, {
            ...faceOptions,
            baseOptions: { ...faceOptions.baseOptions, delegate: "CPU" },
          });
          faceDetectorWarning = "GPU delegate unavailable, falling back to CPU";
        } else {
          throw _;
        }
      }
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
      const faceResponse: any = { type: "handle", id: viaRegister(controller) };
      if (faceDetectorWarning) faceResponse.warning = faceDetectorWarning;
      viaRespond(faceResponse);
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

  if (op === "create_segmenter") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    const requestedDelegate = (command.delegate ?? "GPU") as "CPU" | "GPU";
    try {
      const worker = new Worker(
        new URL("./imageSegmentationWorker.ts", import.meta.url),
        { type: "module" }
      );

      const { warning } = await new Promise<{ warning?: string }>((resolve, reject) => {
        worker.onmessage = (e: MessageEvent) => {
          if (e.data.type === "ready") resolve({ warning: e.data.warning });
          else if (e.data.type === "error") reject(new Error(e.data.message));
        };
        worker.onerror = (e: ErrorEvent) => reject(new Error(e.message ?? "Segmentation worker failed"));
        worker.postMessage({
          type: "init",
          modelPath: "/mediapipe/models/selfie_multiclass_256x256.tflite",
          delegate: requestedDelegate,
        });
      });

      let cachedMask: { data: Uint8Array; width: number; height: number } | null = null;
      let workerBusy = false;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.type !== "result") return;
        if (e.data.mask) cachedMask = { data: e.data.mask, width: e.data.width, height: e.data.height };
        workerBusy = false;
      };

      camera._cameraRef.onFrame = (video: HTMLVideoElement) => {
        if (workerBusy) return;
        workerBusy = true;
        createImageBitmap(video).then((bitmap) => {
          worker.postMessage(
            { type: "segment", bitmap, timestamp: performance.now() },
            [bitmap]
          );
        });
      };

      const CLASS_NAMES = ["background", "hair", "body_skin", "face_skin", "clothes", "others"];

      const controller = {
        _cachedMask: null as { data: Uint8Array; width: number; height: number } | null,
        getSegments() {
          const mask = cachedMask;
          if (!mask) return [];
          const present = new Set<number>();
          for (const byte of mask.data) present.add(byte);
          return [...present].sort().map((i) => CLASS_NAMES[i]).filter(Boolean);
        },
        get _mask() { return cachedMask; },
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

  // Segment class name → categoryMask index
  const SEGMENT_INDEX: Record<string, number> = {
    background: 0, hair: 1, body_skin: 2, face_skin: 3, clothes: 4, others: 5,
  };

  if (op === "color_segment") {
    const canvasController = viaGet(command.canvasHandle);
    const segController = viaGet(command.segmenterHandle);
    if (!canvasController || !segController) {
      viaRespond({ type: "value", value: null });
      return true;
    }
    const classIndex = SEGMENT_INDEX[command.className] ?? -1;
    const opacity = command.opacity ?? 0.5;
    // Parse CSS color to RGB via a temporary canvas element.
    const tmp = document.createElement("canvas").getContext("2d")!;
    tmp.fillStyle = command.color ?? "#ffffff";
    const hex = tmp.fillStyle as string;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const alpha = Math.round(opacity * 255);
    const lw = canvasController._logicalWidth;
    const lh = canvasController._logicalHeight;
    const videoCanvas = canvasController._canvas as HTMLCanvasElement;

    const colorOverlayFn = () => {
      const cached = segController._mask;
      if (!cached || classIndex < 0) return;
      const { data: mask, width: mw, height: mh } = cached;
      const imgData = new ImageData(mw, mh);
      const d = imgData.data;
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === classIndex) {
          d[i * 4]     = r;
          d[i * 4 + 1] = g;
          d[i * 4 + 2] = b;
          d[i * 4 + 3] = alpha;
        }
      }
      const offscreen = new OffscreenCanvas(mw, mh);
      offscreen.getContext("2d")!.putImageData(imgData, 0, 0);
      videoCanvas.getContext("2d")!.drawImage(offscreen, 0, 0, lw, lh);
    };
    if (!canvasController._segmentOverlays) canvasController._segmentOverlays = new Map();
    canvasController._segmentOverlays.set(command.className, colorOverlayFn);
    const segOverlays = canvasController._segmentOverlays;
    canvasController._overlayFn = () => { for (const fn of segOverlays.values()) fn(); };
    viaRespond({ type: "value", value: null });
    return true;
  }

  if (op === "apply_image_to_segment") {
    const canvasController = viaGet(command.canvasHandle);
    const segController = viaGet(command.segmenterHandle);
    if (!canvasController || !segController) {
      viaRespond({ type: "value", value: null });
      return true;
    }
    const classIndex = SEGMENT_INDEX[command.className] ?? -1;
    const opacity = command.opacity ?? 0.8;
    const lw = canvasController._logicalWidth;
    const lh = canvasController._logicalHeight;
    const videoCanvas = canvasController._canvas as HTMLCanvasElement;

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = command.imagePath;
    });

    const imageOverlayFn = () => {
      const cached = segController._mask;
      if (!cached || classIndex < 0 || img.width === 0) return;
      const { data: mask, width: mw, height: mh } = cached;

      // Build a mask at the model's native resolution.
      const maskData = new ImageData(mw, mh);
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === classIndex) maskData.data[i * 4 + 3] = 255;
      }
      const maskCanvas = new OffscreenCanvas(mw, mh);
      maskCanvas.getContext("2d")!.putImageData(maskData, 0, 0);

      // Draw the image at full logical size, then clip it to the segment shape.
      const imgCanvas = new OffscreenCanvas(lw, lh);
      const imgCtx = imgCanvas.getContext("2d")!;
      imgCtx.drawImage(img, 0, 0, lw, lh);
      imgCtx.globalCompositeOperation = "destination-in";
      imgCtx.drawImage(maskCanvas, 0, 0, lw, lh);

      const ctx = videoCanvas.getContext("2d")!;
      ctx.globalAlpha = opacity;
      ctx.drawImage(imgCanvas, 0, 0);
      ctx.globalAlpha = 1;
    };
    if (!canvasController._segmentOverlays) canvasController._segmentOverlays = new Map();
    canvasController._segmentOverlays.set(command.className, imageOverlayFn);
    const segOverlays = canvasController._segmentOverlays;
    canvasController._overlayFn = () => { for (const fn of segOverlays.values()) fn(); };
    viaRespond({ type: "value", value: null });
    return true;
  }

  if (op === "capture_frame") {
    const camera = viaGet(handle);
    if (!camera?._video) {
      viaRespond({ type: "error", message: "Invalid camera handle" });
      return true;
    }
    const video = camera._video as HTMLVideoElement;
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      viaRespond({ type: "error", message: "Camera not ready — no frame available yet" });
      return true;
    }
    const w = camera._logicalWidth;
    const h = camera._logicalHeight;
    const offscreen = new OffscreenCanvas(w, h);
    offscreen.getContext("2d")!.drawImage(video, 0, 0, w, h);
    const blob = await offscreen.convertToBlob({ type: "image/jpeg", quality: 0.85 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    viaRespond({ type: "value", value: `data:image/jpeg;base64,${btoa(binary)}` });
    return true;
  }

  return false;
}

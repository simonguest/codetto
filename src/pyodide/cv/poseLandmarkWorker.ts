/**
 * Off-main-thread pose landmark worker.
 *
 * Receives frames as ImageBitmap (zero-copy transfer) from the main thread,
 * runs MediaPipe PoseLandmarker inference, and posts raw (normalized 0-1)
 * landmark results back. Scaling to logical canvas coordinates happens on
 * the main thread where the canvas dimensions are known.
 *
 * Message protocol:
 *   in  { type: "init", modelPath: string, delegate: "CPU" | "GPU", numPoses: number }
 *   out { type: "ready", warning?: string }
 *   out { type: "error", message: string }
 *
 *   in  { type: "detect", bitmap: ImageBitmap, timestamp: number }
 *   out { type: "result", poses: NormalizedLandmark[][] }
 */

// Same WASM loading fix as objectDetectionWorker — see that file for explanation.
(self as any).importScripts = (...urls: string[]) => {
  for (const url of urls) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();
    if (xhr.status >= 400) throw new Error(`importScripts: ${url} → ${xhr.status}`);
    (0, eval)(xhr.responseText);
  }
};

import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let detector: PoseLandmarker | null = null;

async function initDetector(
  modelPath: string,
  delegate: "CPU" | "GPU",
  numPoses: number
): Promise<{ warning?: string }> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const options = {
    baseOptions: { modelAssetPath: modelPath, delegate },
    runningMode: "VIDEO" as const,
    numPoses,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    detector = await PoseLandmarker.createFromOptions(vision, options);
    return {};
  } catch (_) {
    if (delegate === "GPU") {
      detector = await PoseLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: "CPU" },
      });
      return { warning: "GPU delegate unavailable, falling back to CPU" };
    }
    throw _;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;

  if (type === "init") {
    try {
      const { warning } = await initDetector(
        e.data.modelPath,
        e.data.delegate,
        e.data.numPoses ?? 1
      );
      self.postMessage({ type: "ready", warning });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  if (type === "detect") {
    const { bitmap, timestamp }: { bitmap: ImageBitmap; timestamp: number } = e.data;
    if (!detector) {
      self.postMessage({ type: "result", poses: [] });
      bitmap.close();
      return;
    }
    try {
      const result = detector.detectForVideo(bitmap, timestamp);
      self.postMessage({ type: "result", poses: result.landmarks ?? [] });
    } catch (_) {
      self.postMessage({ type: "result", poses: [] });
    } finally {
      bitmap.close();
    }
  }
};

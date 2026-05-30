/**
 * Off-main-thread object detection worker.
 *
 * Receives frames as ImageBitmap (zero-copy transfer) from the main thread,
 * runs MediaPipe EfficientDet-Lite0 inference, and posts raw detection results
 * back. Scaling to logical canvas coordinates happens on the main thread where
 * the video and canvas dimensions are known.
 *
 * Message protocol:
 *   in  { type: "init", modelPath: string, delegate: "CPU" | "GPU" }
 *   out { type: "ready", warning?: string }
 *   out { type: "error", message: string }
 *
 *   in  { type: "detect", bitmap: ImageBitmap, timestamp: number }
 *   out { type: "result", detections: MediaPipe Detection[] }
 */

// @mediapipe/tasks-vision loads its WASM glue with a helper that tries
// importScripts() first (classic workers) then falls back to import() (module
// workers). Vite's dev server blocks that import() because the file lives in
// /public. Fix: replace importScripts with a synchronous-XHR + indirect-eval
// version that fetches the file as a plain HTTP request (which Vite serves from
// /public without restriction) and evals it into the global scope.
// This override must be in place before createFromOptions() is called; WASM
// loading is lazy so the static import below is safe.
(self as any).importScripts = (...urls: string[]) => {
  for (const url of urls) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false); // synchronous — allowed in workers
    xhr.send();
    if (xhr.status >= 400) throw new Error(`importScripts: ${url} → ${xhr.status}`);
    // Indirect eval runs in the global (self) scope, not the module scope.
    (0, eval)(xhr.responseText);
  }
};

import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";

let detector: ObjectDetector | null = null;

async function initDetector(
  modelPath: string,
  delegate: "CPU" | "GPU"
): Promise<{ warning?: string }> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const options = {
    baseOptions: { modelAssetPath: modelPath, delegate },
    runningMode: "VIDEO" as const,
    maxResults: 10,
    scoreThreshold: 0.5,
  };
  try {
    detector = await ObjectDetector.createFromOptions(vision, options);
    return {};
  } catch (_) {
    if (delegate === "GPU") {
      detector = await ObjectDetector.createFromOptions(vision, {
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
      const { warning } = await initDetector(e.data.modelPath, e.data.delegate);
      self.postMessage({ type: "ready", warning });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  if (type === "detect") {
    const { bitmap, timestamp }: { bitmap: ImageBitmap; timestamp: number } = e.data;
    if (!detector) {
      self.postMessage({ type: "result", detections: [] });
      bitmap.close();
      return;
    }
    try {
      const result = detector.detectForVideo(bitmap, timestamp);
      self.postMessage({ type: "result", detections: result.detections ?? [] });
    } catch (_) {
      self.postMessage({ type: "result", detections: [] });
    } finally {
      bitmap.close();
    }
  }
};

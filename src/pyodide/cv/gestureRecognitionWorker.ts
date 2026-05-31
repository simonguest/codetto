/**
 * Off-main-thread gesture recognition worker.
 *
 * Receives frames as ImageBitmap (zero-copy transfer), runs MediaPipe
 * GestureRecognizer inference, and posts raw results back. Landmark scaling
 * to logical canvas coordinates happens on the main thread.
 *
 * Message protocol:
 *   in  { type: "init", modelPath: string, delegate: "CPU" | "GPU", numHands: number }
 *   out { type: "ready", warning?: string }
 *   out { type: "error", message: string }
 *
 *   in  { type: "detect", bitmap: ImageBitmap, timestamp: number }
 *   out { type: "result", hands: RawHandResult[] }
 *
 * RawHandResult: { gesture, confidence, handedness, landmarks: NormalizedLandmark[] }
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

import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

let recognizer: GestureRecognizer | null = null;

async function initRecognizer(
  modelPath: string,
  delegate: "CPU" | "GPU",
  numHands: number
): Promise<{ warning?: string }> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const options = {
    baseOptions: { modelAssetPath: modelPath, delegate },
    runningMode: "VIDEO" as const,
    numHands,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  try {
    recognizer = await GestureRecognizer.createFromOptions(vision, options);
    return {};
  } catch (_) {
    if (delegate === "GPU") {
      recognizer = await GestureRecognizer.createFromOptions(vision, {
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
      const { warning } = await initRecognizer(
        e.data.modelPath,
        e.data.delegate,
        e.data.numHands ?? 1
      );
      self.postMessage({ type: "ready", warning });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  if (type === "detect") {
    const { bitmap, timestamp }: { bitmap: ImageBitmap; timestamp: number } = e.data;
    if (!recognizer) {
      self.postMessage({ type: "result", hands: [] });
      bitmap.close();
      return;
    }
    try {
      const result = recognizer.recognizeForVideo(bitmap, timestamp);
      const hands = (result.landmarks ?? []).map((landmarks: any, i: number) => ({
        gesture: result.gestures?.[i]?.[0]?.categoryName ?? "None",
        confidence: Math.round((result.gestures?.[i]?.[0]?.score ?? 0) * 100) / 100,
        handedness: result.handedness?.[i]?.[0]?.categoryName ?? "Unknown",
        landmarks,
      }));
      self.postMessage({ type: "result", hands });
    } catch (_) {
      self.postMessage({ type: "result", hands: [] });
    } finally {
      bitmap.close();
    }
  }
};

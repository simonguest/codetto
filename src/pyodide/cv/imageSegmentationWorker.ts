/**
 * Off-main-thread image segmentation worker.
 *
 * Receives frames as ImageBitmap (zero-copy transfer), runs MediaPipe
 * ImageSegmenter inference with categoryMask output, and posts the resulting
 * Uint8Array back. Each byte is the class index (0-5) for that pixel:
 *   0=background  1=hair  2=body_skin  3=face_skin  4=clothes  5=others
 *
 * Message protocol:
 *   in  { type: "init", modelPath: string, delegate: "CPU" | "GPU" }
 *   out { type: "ready", warning?: string }
 *   out { type: "error", message: string }
 *
 *   in  { type: "segment", bitmap: ImageBitmap, timestamp: number }
 *   out { type: "result", mask: Uint8Array, width: number, height: number }
 *
 * Note: segmentForVideo uses a callback whose result lifetime ends after the
 * callback returns — the mask is copied to a new Uint8Array inside the callback.
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

import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

let segmenter: ImageSegmenter | null = null;

async function initSegmenter(
  modelPath: string,
  delegate: "CPU" | "GPU"
): Promise<{ warning?: string }> {
  const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const options = {
    baseOptions: { modelAssetPath: modelPath, delegate },
    runningMode: "VIDEO" as const,
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  };
  try {
    segmenter = await ImageSegmenter.createFromOptions(vision, options);
    return {};
  } catch (_) {
    if (delegate === "GPU") {
      segmenter = await ImageSegmenter.createFromOptions(vision, {
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
      const { warning } = await initSegmenter(e.data.modelPath, e.data.delegate);
      self.postMessage({ type: "ready", warning });
    } catch (err) {
      self.postMessage({ type: "error", message: String(err) });
    }
    return;
  }

  if (type === "segment") {
    const { bitmap, timestamp }: { bitmap: ImageBitmap; timestamp: number } = e.data;
    if (!segmenter) {
      self.postMessage({ type: "result", mask: null });
      bitmap.close();
      return;
    }
    let maskCopy: Uint8Array | null = null;
    let maskWidth = 0;
    let maskHeight = 0;
    try {
      // segmentForVideo is synchronous — callback fires before the call returns.
      // Mask data lifetime is only valid inside the callback, so we copy it.
      segmenter.segmentForVideo(bitmap, timestamp, (result) => {
        const cat = result.categoryMask;
        if (cat) {
          maskCopy = new Uint8Array(cat.getAsUint8Array());
          maskWidth = cat.width;
          maskHeight = cat.height;
        }
      });
    } catch (_) {
      // ignore per-frame errors
    } finally {
      bitmap.close();
    }
    self.postMessage({ type: "result", mask: maskCopy, width: maskWidth, height: maskHeight });
  }
};

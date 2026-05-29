<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";
import { jediStore } from "@store/jediStore";
import { settingsStore } from "@store/settingsStore";
import { Locale } from "@/i18n";
import { viaRegister, viaGet, viaClear } from "@/bridge/viaStore";

const props = defineProps<{ locale: Locale | null }>();
let worker: Worker;

// via.js bridge — main-thread side
let viaSignal: Int32Array | null = null;
let viaData: Uint8Array | null = null;
const viaEncoder = new TextEncoder();

function viaRespond(result: any) {
  const json = JSON.stringify(result);
  const encoded = viaEncoder.encode(json);
  viaData!.set(encoded, 0);
  Atomics.store(viaSignal!, 1, encoded.length);
  Atomics.store(viaSignal!, 0, 1);
  Atomics.notify(viaSignal!, 0, 1);
}

function viaEncodeResult(ret: any): any {
  if (ret === null || ret === undefined) return { type: "value", value: null };
  if (typeof ret !== "object") return { type: "value", value: ret };
  // Plain arrays and plain objects are JSON-safe — return as values so Python
  // receives them as native dicts/lists via json.loads, not as opaque handles.
  if (Array.isArray(ret) || Object.getPrototypeOf(ret) === Object.prototype) {
    return { type: "value", value: ret };
  }
  return { type: "handle", id: viaRegister(ret) };
}

onMounted(async () => {
  console.log("PyodideProvider: Starting new worker.");
  pyodideStore.setWorkerStatus("initializing");
  worker = new Worker(new URL("./PyodideWorker.ts", import.meta.url), {
    type: "module",
  });
  worker.postMessage({
    type: "initialize",
  });

  if (settingsStore.codeCompletion) {
    if (jediStore.status === "disabled") {
      jediStore.initialize();
    } else if (jediStore.status === "ready") {
      syncNotebookPackages();
    }
  }

  worker.onmessage = async (event: MessageEvent<any>) => {
    const { type, text, result, message, error, interruptBuffer, pyodideVersion } = event.data;

    switch (type) {
      case "via_init":
        viaSignal = new Int32Array(event.data.viaSignalSAB);
        viaData = new Uint8Array(event.data.viaDataSAB);
        console.log("PyodideProvider: via.js bridge ready");
        break;
      case "via": {
        const { op, handle, method, prop, args, value, width, height } = event.data.command;
        if (op === "create_canvas") {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const h = viaRegister(canvas);
          if (pyodideStore.runningCellId) {
            notebookStore.setResult(pyodideStore.runningCellId, {
              "application/x-via-canvas": String(h),
            });
          }
          viaRespond({ type: "handle", id: h });
        } else if (op === "call") {
          const obj = viaGet(handle);
          if (!obj) { viaRespond({ type: "value", value: null }); break; }
          const ret = obj[method](...(args ?? []));
          viaRespond(viaEncodeResult(ret));
        } else if (op === "set") {
          const obj = viaGet(handle);
          if (obj) obj[prop] = value;
          viaRespond({ type: "value", value: null });
        } else if (op === "create_camera") {
          const canvas = viaGet(handle);
          if (!canvas) { viaRespond({ type: "error", message: "Invalid canvas handle" }); break; }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement("video");
            video.srcObject = stream;
            video.muted = true;
            video.playsInline = true;
            await video.play();
            const ctx = canvas.getContext("2d");
            let overlayFn: (() => void) | null = null;
            let rafId: number;
            const tick = () => {
              if (video.readyState >= video.HAVE_CURRENT_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                overlayFn?.();
              }
              rafId = requestAnimationFrame(tick);
            };
            rafId = requestAnimationFrame(tick);
            const controller = {
              _video: video,
              _ctx: ctx,
              setOverlay(fn: () => void) { overlayFn = fn; },
              clearOverlay() { overlayFn = null; },
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
        } else if (op === "create_detector") {
          const camera = viaGet(handle);
          if (!camera?._video) { viaRespond({ type: "error", message: "Invalid camera handle" }); break; }
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
        }
        break;
      }
      case "initialized":
        console.log("PyodideProvider: Pyodide is initialized");
        pyodideStore.setWorkerStatus("ready");
        if (interruptBuffer) {
          pyodideStore.setInterruptBuffer(new Int32Array(interruptBuffer));
          console.log("PyodideProvider: Set Interrupt Buffer");
        }
        if (pyodideVersion) {
          pyodideStore.pyodideVersion = pyodideVersion;
        }
        sendEnvVars();
        break;
      case "reset_completed":
        viaClear();
        pyodideStore.resetCompleted();
        syncNotebookPackages();
        sendEnvVars();
        break;
      case "stdout":
        if (pyodideStore.runningCellId) {
          notebookStore.addStdout(pyodideStore.runningCellId, text);
        }
        break;
      case "input_request":
        pyodideStore.requestUserInput(message);
        break;
      case "execute_result":
        if (pyodideStore.runningCellId) {
          if (result) {
            // result will be null if the code didn't return any result
            notebookStore.setResult(pyodideStore.runningCellId, result);
          }
        }
        break;
      case "execute_completed":
        pyodideStore.executionCompleted();
        break;
      case "error":
        if (pyodideStore.runningCellId) {
          notebookStore.setError(pyodideStore.runningCellId, error);
        }
        pyodideStore.executionCompleted();
        break;
      case "fatal":
        pyodideStore.setFatalError(error);
        break;
    }
  };
});

onUnmounted(async () => {
  console.log("PyodideProvider: Terminating worker.");
  pyodideStore.setWorkerStatus("terminating");
  worker.terminate();
});

function sendEnvVars() {
  // Spread into a plain object so structured clone works reliably with Vue reactive proxies
  worker.postMessage({ type: "set_env_vars", envVars: { ...settingsStore.envVars } });
}

function syncNotebookPackages() {
  const cells = notebookStore.content.cells;
  if (!cells?.length) return;
  const allCode = cells
    .filter(c => c.cell_type === "code")
    .map(c => (c.source ?? []).join(""))
    .join("\n");
  if (allCode.trim()) {
    jediStore.syncPackages(allCode);
  }
}

watch(
  () => jediStore.status,
  status => {
    if (status === "ready") syncNotebookPackages();
  }
);

watch(
  () => pyodideStore.executionStatus,
  newExecutionStatus => {
    if (newExecutionStatus === "queued" && pyodideStore.runningCellId != null) {
      // Grab the source from the notebook
      const code = notebookStore.parseGlobals(
        notebookStore.getLocalizedSource(pyodideStore.runningCellId, props.locale) || [],
        props.locale
      );
      const codeStr = code?.join("") ?? "";
      worker.postMessage({
        type: "run",
        cellId: pyodideStore.runningCellId,
        code: codeStr,
      });
      jediStore.syncPackages(codeStr);
    }
    if (newExecutionStatus === "reset") {
      worker.postMessage({
        type: "reset"
      });
      syncNotebookPackages();
    }
  }
);

watch(
  () => settingsStore.envVars,
  () => {
    if (pyodideStore.workerStatus === "ready") {
      sendEnvVars();
    }
  },
  { deep: true }
);

watch(
  () => pyodideStore.inputStatus,
  newInputStatus => {
    if (newInputStatus === "submitted") {
      worker.postMessage({
        type: "input_response",
        value: pyodideStore.userInput,
      });
    }
  }
);
</script>

<template>
  <slot />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";

import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";
import { Locale } from "@/i18n";

const props = defineProps<{ notebookId: string; locale: Locale | null }>();
let worker: Worker;

onMounted(async () => {
  console.log("PyodideProvider: Starting new worker for " + props.notebookId);
  pyodideStore.setWorkerStatus("initializing");
  worker = new Worker(new URL("./PyodideWorker.ts", import.meta.url), {
    type: "module",
  });
  worker.postMessage({
    type: "initialize",
  });

  worker.onmessage = async (event: MessageEvent<any>) => {
    const { type, text, result, message, error, interruptBuffer } = event.data;

    switch (type) {
      case "initialized":
        console.log("PyodideProvider: Pyodide is initialized");
        pyodideStore.setWorkerStatus("ready");
        if (interruptBuffer) {
          pyodideStore.setInterruptBuffer(new Int32Array(interruptBuffer));
          console.log("PyodideProvider: Set Interrupt Buffer");
        }
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

watch(
  () => pyodideStore.executionStatus,
  newExecutionStatus => {
    if (newExecutionStatus === "queued" && pyodideStore.runningCellId != null) {
      // Grab the source from the notebook
      const code = notebookStore.parseGlobals(
        notebookStore.getLocalizedSource(pyodideStore.runningCellId, props.locale) || [],
        props.locale
      );
      worker.postMessage({
        type: "run",
        cellId: pyodideStore.runningCellId,
        code: code?.join(""),
      });
    }
  }
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

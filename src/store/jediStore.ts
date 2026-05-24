import { reactive } from "vue";

export type JediStatus = "disabled" | "initializing" | "ready" | "error";

export interface JediCompletion {
  name: string;
  type: string;
  prefixLen: number;
}

export const jediStore = reactive({
  status: "disabled" as JediStatus,
  _worker: null as Worker | null,
  _lastRequestId: 0,

  initialize() {
    if (this._worker || this.status !== "disabled") return;
    this.status = "initializing";
    this._worker = new Worker(new URL("../pyodide/JediWorker.ts", import.meta.url), {
      type: "module",
    });
    this._worker.onmessage = (event: MessageEvent) => {
      const { type } = event.data;
      if (type === "initialized") {
        console.log("jediStore: Jedi worker ready");
        this.status = "ready";
      } else if (type === "error") {
        console.error("jediStore: Jedi worker failed to initialize:", event.data.error);
        this.status = "error";
      }
    };
    this._worker.postMessage({ type: "initialize" });
  },

  terminate() {
    this._worker?.terminate();
    this._worker = null;
    this.status = "disabled";
  },

  syncPackages(code: string) {
    if (this._worker && this.status === "ready") {
      this._worker.postMessage({ type: "sync_packages", code });
    }
  },

  complete(script: string, line: number, column: number): Promise<JediCompletion[]> {
    return new Promise(resolve => {
      if (!this._worker || this.status !== "ready") {
        resolve([]);
        return;
      }

      const requestId = ++this._lastRequestId;

      const handler = (event: MessageEvent) => {
        if (event.data.type === "completions" && event.data.requestId === requestId) {
          this._worker!.removeEventListener("message", handler);
          resolve(event.data.completions ?? []);
        }
      };

      this._worker.addEventListener("message", handler);
      this._worker.postMessage({ type: "complete", script, line, column, requestId });
    });
  },
});

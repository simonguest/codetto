import { reactive } from "vue";

export type ExecutionStatus = "idle" | "queued" | "running" | "reset";
export type InputStatus = "idle" | "waiting" | "submitted";
export type WorkerStatus = "initializing" | "ready" | "error" | "interrupted" | "terminating";

export const pyodideStore = reactive({
  executionStatus: "idle" as ExecutionStatus,
  workerStatus: "initializing" as WorkerStatus,
  runningCellId: null as string | null,
  interruptBuffer: null as Int32Array | null,
  fatalErrorTrace: "",
  inputStatus: "idle" as InputStatus,
  inputPrompt: null as string | null,
  userInput: null as string | null,
  pyodideVersion: null as string | null,
  // True from the moment Stop is clicked until the worker acknowledges the
  // interrupt via an error message. Keeps the Run button disabled during
  // that window to prevent a new run from starting before the old one's
  // KeyboardInterrupt message has been processed.
  _interruptPending: false,
  setInterruptBuffer(buffer: Int32Array) {
    this.interruptBuffer = buffer;
  },
  clearInterruptBuffer() {
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 0;
    }
  },
  interruptExecution() {
    if (this.interruptBuffer) {
      this.interruptBuffer[0] = 2;
      this._interruptPending = true;
    }
    this.executionStatus = "idle";
  },
  setWorkerStatus(status: WorkerStatus) {
    this.workerStatus = status;
  },
  executeCell(cellId: string) {
    if (this.executionStatus === "idle" && this.workerStatus === "ready") {
      this.runningCellId = cellId;
      this.executionStatus = "queued";
    }
  },
  executionCompleted() {
    this.runningCellId = null;
    this.executionStatus = "idle";
    this._interruptPending = false;
  },
  setFatalError(trace: string) {
    this.workerStatus = "error";
    this.fatalErrorTrace = trace;
  },
  requestUserInput(prompt: string) {
    this.inputStatus = "waiting";
    this.userInput = null,
      this.inputPrompt = prompt;
  },
  submitUserInput(input: string | null) {
    this.inputStatus = "submitted";
    this.userInput = input;
  },
  resetGlobals() {
    if (this.executionStatus === "idle" && this.workerStatus === "ready") {
      this.executionStatus = "reset";
    }
  },
  resetCompleted() {
    this.runningCellId = null;
    this.executionStatus = "idle";
    this._interruptPending = false;
  }
});

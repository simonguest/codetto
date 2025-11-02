import { reactive } from "vue";

export type ExecutionStatus = "idle" | "queued" | "running";
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
  }
});

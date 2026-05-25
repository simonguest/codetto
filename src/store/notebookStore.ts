import { reactive } from "vue";
import { v4 as uuidv4 } from "uuid";

import { Notebook, Output, NOTEBOOK_SKELETON } from "@schemas/notebook";
import { Locale } from "@/i18n";

export type OutputType = "result" | "stdout" | "error";

export const notebookStore = reactive({
  content: {} as Notebook,
  updated: null as Number | null,
  clear() {
    this.updated = null;
    this.content = NOTEBOOK_SKELETON;
  },
  findCell(cellId: string) {
    if (!this.content.cells) {
      return null;
    }
    return this.content.cells.find(cell => cell.id === cellId);
  },
  getSource(cellId: string) {
    const cell = this.findCell(cellId);
    return cell ? cell.source : null;
  },
  setSource(cellId: string, source: string[]) {
    const cell = this.findCell(cellId);
    if (cell) {
      source = source.map((line, i) => i < source.length - 1 ? line + "\n" : line);
      cell.source = source;
      this.updated = Date.now();
    }
  },
  getLocalizedSource(cellId: string, locale: Locale | null): string[] | undefined {
    const cell = this.findCell(cellId);
    if (!cell) return undefined;

    let source = cell.source;

    if (locale === null) return source;

    if (cell.metadata["i18n"]) {
      if (cell.metadata["i18n"][locale]) {
        source = cell.metadata["i18n"][locale];
      }
    }

    return source;
  },
  setLocalizedSource(cellId: string, source: string[], locale: Locale | null) {
    const cell = this.findCell(cellId);
    if (!cell) return undefined;

    // If no locale, just set the source directly
    if (locale === null) {
      this.setSource(cellId, source);
    } else {
      source = source.map((line, i) => i < source.length - 1 ? line + "\n" : line);

      if (!cell.metadata["i18n"]) {
        cell.metadata["i18n"] = {};
      }
      cell.metadata["i18n"][locale] = source;
      this.updated = Date.now();
    }
  },
  parseGlobals(source: string[], locale: Locale | null) {
    if (locale === null) return source;

    // Get globals from notebook metadata
    const globals = this.content.metadata?.globals;
    if (!globals) {
      // No globals defined, return original source
      return source;
    }

    // Process each line of source code
    const updatedSource = source.map(line => {
      // Replace jinja templates ({{VARIABLE}}) with localized values
      return line.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, variableName) => {
        const globalVar = globals[variableName];
        if (!globalVar) {
          // Variable not found in globals, return original
          return match;
        }

        // Get localized value, fallback to default if locale not found
        const localizedValue = globalVar[locale] || globalVar.default;
        if (localizedValue === undefined) {
          // No value found, return original
          return match;
        }

        // Return the value wrapped in quotes (assuming string values)
        return `${localizedValue}`;
      });
    });

    return updatedSource;
  },
  clearOutputs(cellId: string) {
    const cell = this.findCell(cellId);
    if (cell) {
      cell.outputs = [];
      this.updated = Date.now();
    }
  },
  getOutputTypes(cellId: string) {
    let result: OutputType[] = [];
    const cell = this.findCell(cellId);
    if (cell) {
      if (
        cell.outputs?.findIndex(
          (output: Output) =>
            output.output_type === "execute_result" || output.output_type === "display_data"
        ) !== -1
      ) {
        result.push("result");
      }
      if (
        cell.outputs?.findIndex(
          (output: Output) => output.output_type === "stream" && output.name === "stdout"
        ) !== -1
      ) {
        result.push("stdout");
      }
      if (cell.outputs?.findIndex((output: Output) => output.output_type === "error") !== -1) {
        result.push("error");
      }
    }
    return result;
  },
  addStdout(cellId: string, stdout: string) {
    const cell = this.findCell(cellId);
    if (cell) {
      if (!cell.outputs) cell.outputs = [];
      const index = cell.outputs.findIndex(
        (output: Output) => output.output_type === "stream" && output.name === "stdout"
      );
      if (index !== -1) {
        if (!cell.outputs[index].text) {
          cell.outputs[index].text = [];
        }
        cell.outputs[index].text.push(stdout);
      } else {
        cell.outputs.push({
          output_type: "stream",
          name: "stdout",
          text: [stdout],
        });
      }
      this.updated = Date.now();
    }
  },
  getStdout(cellId: string) {
    let console = "";
    const cell = this.findCell(cellId);
    if (cell) {
      cell.outputs?.forEach(output => {
        if (output.output_type === "stream") {
          console += output.text?.join("") || "";
        }
      });
    }
    return console;
  },
  setResult(cellId: string, result: any) {
    const cell = this.findCell(cellId);
    if (cell) {
      if (!cell.outputs) cell.outputs = [];

      // Find if there's already an execute_result output
      const executeResultIndex = cell.outputs.findIndex(
        (output: Output) => output.output_type === "execute_result"
      );

      if (executeResultIndex !== -1) {
        // If execute_result already exists, merge the data objects
        const existingData = cell.outputs[executeResultIndex].data || {};
        cell.outputs[executeResultIndex].data = {
          ...existingData,
          ...result,
        };
      } else {
        // If no execute_result exists, create a new one
        cell.outputs.push({
          output_type: "execute_result",
          data: result,
        });
      }
      this.updated = Date.now();
    }
  },
  getResult(cellId: string) {
    let result = {};
    const cell = this.findCell(cellId);
    if (cell) {
      cell.outputs?.forEach(output => {
        if (output.output_type === "execute_result" || output.output_type === "display_data") {
          if (output.data) {
            result = output.data;
          }
        }
      });
    }
    return result;
  },
  setError(cellId: string, traceback: string | string[]) {
    const cell = this.findCell(cellId);
    if (cell) {
      if (!cell.outputs) cell.outputs = [];
      const tracebackArray = Array.isArray(traceback) ? traceback : traceback.split("\n");
      cell.outputs.push({
        output_type: "error",
        traceback: tracebackArray,
      });
      this.updated = Date.now();
    }
  },
  getError(cellId: string) {
    let error = "";
    const cell = this.findCell(cellId);
    if (cell) {
      cell.outputs?.forEach(output => {
        if (output.output_type === "error") {
          error += output.traceback?.join("") || "";
        }
      });
    }
    return error;
  },
  loadNotebook(notebook: Notebook) {
    // check for the existance of valid cell ids - if no valid one, assign a UUID
    if (notebook.cells) {
      notebook.cells.forEach(cell => {
        if (!cell.id || typeof cell.id !== "string" || cell.id.trim() === "") {
          cell.id = uuidv4();
        }
      });
      this.content = notebook;
    }
  },
  hasTag(cellId: string, tag: string): boolean {
    const cell = this.findCell(cellId);
    if (!cell || !cell.metadata.tags) {
      return false;
    }
    return cell.metadata.tags.includes(tag);
  },
  addTag(cellId: string, tag: string) {
    const cell = this.findCell(cellId);
    if (cell) {
      if (!cell.metadata.tags) {
        cell.metadata.tags = [];
      }
      if (!cell.metadata.tags.includes(tag)) {
        cell.metadata.tags.push(tag);
        this.updated = Date.now();
      }
    }
  },
  removeTag(cellId: string, tag: string) {
    const cell = this.findCell(cellId);
    if (cell && cell.metadata.tags) {
      const index = cell.metadata.tags.indexOf(tag);
      if (index !== -1) {
        cell.metadata.tags.splice(index, 1);
        this.updated = Date.now();
      }
    }
  },
  toggleTag(cellId: string, tag: string) {
    if (this.hasTag(cellId, tag)) {
      this.removeTag(cellId, tag);
    } else {
      this.addTag(cellId, tag);
    }
  },
  getGlobals() {
    if (!this.content.metadata) this.content.metadata = {};
    if (!this.content.metadata.globals) this.content.metadata.globals = {};
    return this.content.metadata.globals;
  },
  setGlobal(name: string, values: Record<string, string>) {
    const globals = this.getGlobals();
    globals[name] = values;
    this.updated = Date.now();
  },
  deleteGlobal(name: string) {
    const globals = this.getGlobals();
    delete globals[name];
    this.updated = Date.now();
  },
});

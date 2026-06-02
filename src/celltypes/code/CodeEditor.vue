<script setup lang="ts">
import { onMounted, watch, computed, ref } from "vue";
import { EditorState, Prec } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import { autocompletion, CompletionContext, CompletionResult, CompletionSource } from "@codemirror/autocomplete";

import { notebookStore } from "@store/notebookStore";
import { settingsStore } from "@store/settingsStore";
import { jediStore } from "@store/jediStore";
import { pyodideStore } from "@store/pyodideStore";
import { Theme } from "@/theme";
import { Locale } from "@/i18n";

import { basicLight } from "./themes/basicLight";
import { materialDark } from "./themes/materialDark";
import { colorPickerExtension, colorPickerTheme } from "./colorPickerExtension";

const JEDI_TYPE_MAP: Record<string, string> = {
  module: "namespace",
  class: "class",
  instance: "variable",
  function: "function",
  statement: "variable",
  keyword: "keyword",
  path: "text",
  property: "property",
};

const props = defineProps<{
  metadata: any;
  id: string;
  theme: Theme;
  locale: Locale | null;
}>();

let editorView: EditorView | null = null;
let isUpdatingFromStore = false;
const isCompletionLoading = ref(false);

const source = computed<string[]>(() => {
  const rawSource = notebookStore.getSource(props.id) || [];
  return notebookStore.parseGlobals(rawSource, props.locale);
});

function buildPriorCode(): string {
  const cells = notebookStore.content.cells ?? [];
  const myIndex = cells.findIndex(c => c.id === props.id);
  if (myIndex <= 0) return "";

  return cells
    .slice(0, myIndex)
    .filter(c => c.cell_type === "code")
    .map(c => {
      const src = notebookStore.parseGlobals(c.source ?? [], props.locale);
      return src.join("");
    })
    .join("");
}

async function delegateToBuiltins(context: CompletionContext): Promise<CompletionResult | null> {
  const sources = context.state.languageDataAt<CompletionSource>("autocomplete", context.pos);
  for (const source of sources) {
    const result = await source(context);
    if (result) return result;
  }
  return null;
}

async function jediCompletionSource(context: CompletionContext): Promise<CompletionResult | null> {
  const charBefore = context.state.sliceDoc(context.pos - 1, context.pos);
  const useJedi = settingsStore.codeCompletion &&
    jediStore.status === "ready" &&
    (charBefore === "." || context.explicit);

  if (!useJedi) return delegateToBuiltins(context);

  const word = context.matchBefore(/\w*/);
  const from = word?.from ?? context.pos;

  const currentCellContent = context.state.doc.toString();
  const priorCode = buildPriorCode();
  const fullScript = priorCode + currentCellContent;

  const priorLineCount = (priorCode.match(/\n/g) ?? []).length;
  const cmLine = context.state.doc.lineAt(context.pos);
  const fullLine = priorLineCount + cmLine.number;
  const fullCol = context.pos - cmLine.from;

  isCompletionLoading.value = true;
  const completions = await jediStore.complete(fullScript, fullLine, fullCol);
  isCompletionLoading.value = false;
  if (context.aborted) return null;
  if (!completions.length) return delegateToBuiltins(context);

  return {
    from,
    options: completions.map(c => ({
      label: c.name,
      type: JEDI_TYPE_MAP[c.type] ?? "text",
      detail: c.type,
      info: c.docstring || undefined,
    })),
    validFor: /^\w*$/,
  };
}

onMounted(() => {
  let theme = basicLight;
  switch (props.theme) {
    case "dark":
      theme = materialDark;
      break;
  }

  const startState = EditorState.create({
    doc: source.value ? source.value.join("") : "",
    extensions: [
      basicSetup,
      python(),
      theme,
      indentUnit.of("  "),
      EditorView.lineWrapping,
      autocompletion({ override: [jediCompletionSource] }),
      colorPickerExtension,
      colorPickerTheme,
      Prec.highest(keymap.of([indentWithTab, {
        key: "Mod-Enter",
        run: () => {
          if (pyodideStore.executionStatus === "idle" && pyodideStore.workerStatus === "ready") {
            notebookStore.clearOutputs(props.id);
            pyodideStore.executeCell(props.id);
          }
          return true;
        },
      }])),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !isUpdatingFromStore) {
          const newSource = update.state.doc.toString();
          notebookStore.setSource(
            props.id,
            newSource.includes("\n") ? newSource.split("\n") : [newSource]
          );
        }
      }),
    ],
  });

  editorView = new EditorView({
    state: startState,
    parent: document.getElementById("code-editor-" + props.id) as HTMLElement,
  });
});

watch(
  () => source.value,
  newSource => {
    if (editorView && newSource && !isUpdatingFromStore) {
      const currentDoc = editorView.state.doc.toString();
      const newDoc = newSource.join("");

      const currentNormalized = currentDoc.replace(/\n+$/, "");
      const newNormalized = newDoc.replace(/\n+$/, "");

      if (currentNormalized !== newNormalized) {
        isUpdatingFromStore = true;
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: newDoc,
          },
        });
        isUpdatingFromStore = false;
      }
    }
  },
  { deep: true }
);
</script>

<template>
  <div class="code-editor-container">
    <div :id="`code-editor-${props.id}`" />
    <div v-if="isCompletionLoading" class="completion-loading-indicator" />
  </div>
</template>

<style scoped>
.code-editor-container {
  position: relative;
}

.completion-loading-indicator {
  position: absolute;
  bottom: 6px;
  right: 8px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-theme-primary), 0.2);
  border-top-color: rgb(var(--v-theme-primary));
  animation: completion-spin 0.7s linear infinite;
  pointer-events: none;
}

@keyframes completion-spin {
  to { transform: rotate(360deg); }
}
</style>

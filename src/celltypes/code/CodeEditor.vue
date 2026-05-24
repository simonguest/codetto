<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python, pythonLanguage } from "@codemirror/lang-python";
import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

import { notebookStore } from "@store/notebookStore";
import { settingsStore } from "@store/settingsStore";
import { jediStore } from "@store/jediStore";
import { Theme } from "@/theme";
import { Locale } from "@/i18n";

import { basicLight } from "./themes/basicLight";
import { materialDark } from "./themes/materialDark";

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

async function jediCompletionSource(context: CompletionContext): Promise<CompletionResult | null> {
  if (!settingsStore.codeCompletion) return null;
  if (jediStore.status !== "ready") return null;

  const charBefore = context.state.sliceDoc(context.pos - 1, context.pos);
  if (!context.explicit && charBefore !== ".") return null;

  const word = context.matchBefore(/\w*/);
  const from = word?.from ?? context.pos;

  const currentCellContent = context.state.doc.toString();
  const priorCode = buildPriorCode();
  const fullScript = priorCode + currentCellContent;

  const priorLineCount = (priorCode.match(/\n/g) ?? []).length;
  const cmLine = context.state.doc.lineAt(context.pos);
  const fullLine = priorLineCount + cmLine.number;
  const fullCol = context.pos - cmLine.from;

  const completions = await jediStore.complete(fullScript, fullLine, fullCol);
  if (context.aborted) return null;
  if (!completions.length) return null;

  return {
    from,
    options: completions.map(c => ({
      label: c.name,
      type: JEDI_TYPE_MAP[c.type] ?? "text",
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
      EditorView.lineWrapping,
      pythonLanguage.data.of({ autocomplete: jediCompletionSource }),
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
  <div :id="`code-editor-${props.id}`" />
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref } from "vue";
import { EditorState, Prec, StateEffect, StateField } from "@codemirror/state";
import { EditorView } from "codemirror";
import {
  keymap, showTooltip, tooltips, type Tooltip,
  lineNumbers, highlightActiveLineGutter, highlightSpecialChars,
  drawSelection, dropCursor, rectangularSelection, crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import {
  indentWithTab, history,
  defaultKeymap, historyKeymap,
} from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  indentUnit, foldGutter, foldKeymap, indentOnInput,
  syntaxHighlighting, defaultHighlightStyle,
} from "@codemirror/language";
import { python } from "@codemirror/lang-python";
import {
  autocompletion, CompletionContext, CompletionResult, CompletionSource, completionKeymap,
} from "@codemirror/autocomplete";
import { renderMarkdown } from "@/utils/markdown";

import { notebookStore } from "@store/notebookStore";
import { settingsStore } from "@store/settingsStore";
import { jediStore } from "@store/jediStore";
import { pyodideStore } from "@store/pyodideStore";
import { Theme } from "@/theme";
import { Locale } from "@/i18n";

import { basicLight } from "./themes/basicLight";
import { materialDark } from "./themes/materialDark";
import { colorPickerExtension, colorPickerTheme } from "./colorPickerExtension";

const customSetup = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  // bracketMatching() and closeBrackets() omitted — distracting/confusing for students
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
  ]),
];

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

// --- Signature help ---

const setSignatureTooltip = StateEffect.define<Tooltip | null>();

function isInsideParens(state: EditorState, pos: number): boolean {
  const text = state.sliceDoc(0, pos);
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === ")") depth++;
    else if (text[i] === "(") {
      if (depth === 0) return true;
      depth--;
    }
  }
  return false;
}

function findOpenParenPos(state: EditorState, pos: number): number | null {
  const text = state.sliceDoc(0, pos);
  let depth = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === ")") depth++;
    else if (text[i] === "(") {
      if (depth === 0) return i;
      depth--;
    }
  }
  return null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const signatureTooltipField = StateField.define<Tooltip | null>({
  create: () => null,
  update(tooltip, tr) {
    for (const e of tr.effects) {
      if (e.is(setSignatureTooltip)) return e.value;
    }
    if (tooltip && (tr.docChanged || tr.selection)) {
      if (!isInsideParens(tr.state, tr.state.selection.main.head)) return null;
    }
    return tooltip;
  },
  provide: f => showTooltip.from(f),
});

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

async function triggerSignatureHelp(view: EditorView) {
  if (!settingsStore.codeCompletion || jediStore.status !== "ready") return;

  const pos = view.state.selection.main.head;
  const openParenPos = findOpenParenPos(view.state, pos);
  if (openParenPos === null) return;

  const currentCellContent = view.state.doc.toString();
  const priorCode = buildPriorCode();
  const fullScript = priorCode + currentCellContent;
  const priorLineCount = (priorCode.match(/\n/g) ?? []).length;
  const cmLine = view.state.doc.lineAt(pos);
  const fullLine = priorLineCount + cmLine.number;
  const fullCol = pos - cmLine.from;

  const sigs = await jediStore.signatures(fullScript, fullLine, fullCol);

  // Re-check: cursor may have left parens while fetching
  const currentPos = view.state.selection.main.head;
  const currentOpenParen = findOpenParenPos(view.state, currentPos);
  if (currentOpenParen === null || !sigs.length) return;

  const sig = sigs[0];

  const dom = document.createElement("div");
  dom.className = "cm-signature-help";
  // Prevent mousedown from moving focus away from the editor
  dom.addEventListener("mousedown", e => e.preventDefault());

  const header = document.createElement("code");
  header.className = "cm-sig-header";
  const paramHtml = sig.params.map((p, i) => {
    const ep = escapeHtml(p);
    return i === sig.index ? `<strong>${ep}</strong>` : ep;
  }).join(", ");
  header.innerHTML = `${escapeHtml(sig.name)}(${paramHtml})`;
  dom.appendChild(header);

  if (sig.docstring) {
    const docDiv = document.createElement("div");
    docDiv.className = "cm-sig-doc";
    docDiv.innerHTML = renderMarkdown(sig.docstring);
    dom.appendChild(docDiv);
  }

  view.dispatch({
    effects: setSignatureTooltip.of({
      pos: currentOpenParen,
      above: true,
      create: () => ({ dom }),
    }),
  });
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
      boost: c.name.startsWith("_") ? -99 : 0,
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
      ...customSetup,
      python(),
      theme,
      indentUnit.of("  "),
      EditorView.lineWrapping,
      tooltips({ parent: document.body }),
      autocompletion({ override: [jediCompletionSource] }),
      colorPickerExtension,
      colorPickerTheme,
      signatureTooltipField,
      EditorView.baseTheme({
        ".cm-tooltip": {
          fontSize: "0.875rem",
        },
        ".cm-signature-help": {
          padding: "6px 10px",
          maxHeight: "260px",
          overflowY: "auto",
          maxWidth: "500px",
        },
        ".cm-sig-header": {
          display: "block",
          fontFamily: "monospace",
          fontSize: "0.88em",
          lineHeight: "1.5",
          marginBottom: "4px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        },
        ".cm-sig-doc": {
          fontSize: "0.82em",
          lineHeight: "1.5",
          borderTop: "1px solid rgba(128,128,128,0.3)",
          paddingTop: "6px",
          marginTop: "4px",
          "& p": { margin: "0 0 4px 0" },
          "& pre": { overflowX: "auto", padding: "4px" },
          "& code": { fontSize: "0.9em" },
        },
      }),
      Prec.highest(keymap.of([indentWithTab, {
        key: "Mod-Enter",
        run: () => {
          if (pyodideStore.executionStatus === "idle" && pyodideStore.workerStatus === "ready") {
            notebookStore.markPendingClear(props.id);
            pyodideStore.executeCell(props.id);
          }
          return true;
        },
      }, {
        key: "Ctrl-Space",
        run: (view) => {
          if (isInsideParens(view.state, view.state.selection.main.head)) {
            triggerSignatureHelp(view);
            return true;
          }
          return false;
        },
      }, {
        key: "Escape",
        run: (view) => {
          if (view.state.field(signatureTooltipField)) {
            view.dispatch({ effects: setSignatureTooltip.of(null) });
            return true;
          }
          return false;
        },
      }])),
      EditorView.domEventHandlers({
        blur: (_e, view) => {
          if (view.state.field(signatureTooltipField)) {
            view.dispatch({ effects: setSignatureTooltip.of(null) });
          }
        },
      }),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !isUpdatingFromStore) {
          const newSource = update.state.doc.toString();
          notebookStore.setSource(
            props.id,
            newSource.includes("\n") ? newSource.split("\n") : [newSource]
          );
          // Auto-trigger on ( insertion
          const pos = update.state.selection.main.head;
          if (update.state.sliceDoc(pos - 1, pos) === "(") {
            triggerSignatureHelp(update.view);
          }
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

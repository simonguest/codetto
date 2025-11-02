<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { EditorState } from "@codemirror/state";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";

import { notebookStore } from "@store/notebookStore";
import { Theme } from "@/theme";
import { Locale } from "@/i18n";

import { basicLight } from "./themes/basicLight";
import { materialDark } from "./themes/materialDark";


const props = defineProps<{
  metadata: any;
  id: string;
  theme: Theme;
  locale: Locale | null;
}>();

let editorView: EditorView | null = null;
let isUpdatingFromStore = false;

// Process source with localization and globals
const source = computed<string[]>(() => {
  const rawSource = notebookStore.getSource(props.id) || [];
  return notebookStore.parseGlobals(rawSource, props.locale);
});

onMounted(() => {
  // Figure out the right theme to use
  let theme = basicLight; // default
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

// Watch for source changes and update the editor
watch(
  () => source.value,
  newSource => {
    if (editorView && newSource && !isUpdatingFromStore) {
      const currentDoc = editorView.state.doc.toString();
      const newDoc = newSource.join("");

      // Only update if the content is actually different
      // Be more lenient with trailing newlines to avoid interfering with user input
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

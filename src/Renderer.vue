<script setup lang="ts">
import { onMounted, watch, computed } from "vue";

import { Locale, RENDERER_LABELS } from "@/i18n";
import { Theme } from "@/theme";
import { notebookStore } from "@store/notebookStore";
import type { Notebook } from "@schemas/notebook";
import { pyodideStore } from "@store/pyodideStore";
import MarkdownCell from "@celltypes/markdown";
import CodeCell from "@celltypes/code";
import VideoCell from "@celltypes/video";
import ChatCell from "@celltypes/chat";
import JournalCell from "@celltypes/journal";
import InputDialog from "@components/InputDialog.vue";

const props = defineProps<{
  id: string;
  initialNotebook: Notebook;
  theme: Theme;
  locale: Locale;
}>();

onMounted(() => {
  // Load the initial notebook
  notebookStore.loadNotebook(props.initialNotebook);
  // New notebook opened, so reset the globals from Pyodide
  pyodideStore.resetGlobals();
});

watch(
  () => props.initialNotebook,
  newNotebook => {
    notebookStore.loadNotebook(newNotebook);
  }
);

// Get renderer labels based on current locale
const rendererLabels = computed(() => RENDERER_LABELS[props.locale]);
</script>

<template>
  <div class="viewer-container">
    <v-expand-transition>
      <v-alert
        v-if="pyodideStore.workerStatus == 'initializing'"
        :text="rendererLabels.notebookStarting"
        type="info"
        variant="tonal"
        density="compact"
      ></v-alert>
    </v-expand-transition>
    <v-expand-transition>
      <v-alert
        v-if="pyodideStore.workerStatus == 'error'"
        :text="`${rendererLabels.notebookStartError} ${pyodideStore.fatalErrorTrace}`"
        type="error"
        variant="tonal"
        density="compact"
      ></v-alert>
    </v-expand-transition>

    <div v-for="cell in notebookStore.content.cells">
      <MarkdownCell
        v-if="cell.cell_type === 'markdown' && !cell.metadata.tags?.includes('journal')"
        :cell="cell"
        :metadata="cell.metadata"
        :locale="props.locale"
      />
      <JournalCell
        v-if="cell.cell_type === 'markdown' && cell.metadata.tags?.includes('journal')"
        :cell="cell"
        :locale="props.locale"
      />
      <CodeCell
        v-if="cell.cell_type === 'code'"
        :cell="cell"
        :theme="props.theme"
        :locale="props.locale"
      />
      <VideoCell
        v-if="cell.cell_type === 'raw' && cell.metadata.tags?.includes('video')"
        :cell="cell"
        :locale="props.locale"
      />
      <ChatCell
        v-if="cell.cell_type === 'raw' && cell.metadata.tags?.includes('chat')"
        :cell="cell"
        :locale="props.locale"
      />
    </div>

    <InputDialog :locale="props.locale" />
  </div>
</template>

<style>
@import "./styles.css";
@import "./icons.min.css";

.renderer-container {
  padding-left: 8px;
  padding-right: 8px;
}

@media (width < 600px) {
  .renderer-container {
    padding-left: 4px;
    padding-right: 4px;
  }
}
</style>

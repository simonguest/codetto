<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { marked } from "marked";

import { Locale } from "@/i18n";
import type { Cell } from "@schemas/notebook";
import { notebookStore } from "@store/notebookStore";

const props = defineProps<{
  cell: Cell;
  locale: Locale | null;
}>();

const toMarkdown = (source: string[] | undefined) => {
  if (!source) return "";
  return marked.parse(source.join(""));
};

// Process source with localization and globals
const processedSource = computed(() => {
  const localizedSource = notebookStore.getLocalizedSource(props.cell.id, props.locale) || [];
  return notebookStore.parseGlobals(localizedSource, props.locale);
});

</script>

<template>
  <v-card variant="text" max-width="800" class="pt-2 pb-2 ma-auto">
    <v-card-text>
      <div
        class="markdown-content"
        v-html="toMarkdown(processedSource)"
      ></div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-block-start: 1em;
  margin-block-end: 0.5em;
}

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(h4:first-child),
.markdown-content :deep(h5:first-child),
.markdown-content :deep(h6:first-child) {
  margin-block-start: 0;
}

.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-block-end: 1em;
}

.markdown-content :deep(p:last-child),
.markdown-content :deep(ul:last-child),
.markdown-content :deep(ol:last-child) {
  margin-block-end: 0;
}
</style>

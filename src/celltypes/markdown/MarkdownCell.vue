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
        v-html="toMarkdown(processedSource)"
      ></div>
    </v-card-text>
  </v-card>
</template>

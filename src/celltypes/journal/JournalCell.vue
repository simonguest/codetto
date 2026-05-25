<script setup lang="ts">
import { ref, computed } from "vue";
import { marked } from "marked";
import type { Cell } from "@schemas/notebook";
import type { Locale } from "@/i18n";
import { RENDERER_LABELS } from "@/i18n";
import { notebookStore } from "@store/notebookStore";

const props = defineProps<{
  cell: Cell;
  locale: Locale | null;
}>();

const editMode = ref(false);
const editContent = ref("");

const labels = computed(() => RENDERER_LABELS[props.locale ?? "en-US"]);

const processedSource = computed(() => {
  const localizedSource = notebookStore.getLocalizedSource(props.cell.id, props.locale) || [];
  return notebookStore.parseGlobals(localizedSource, props.locale);
});

const renderedContent = computed(() => {
  return marked.parse(processedSource.value.join("")) as string;
});

const hasContent = computed(() => {
  return processedSource.value.join("").trim().length > 0;
});

function enterEditMode() {
  editContent.value = (props.cell.source || []).join("");
  editMode.value = true;
}

function closeEditMode() {
  const lines = editContent.value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  notebookStore.setSource(props.cell.id, lines);
  editMode.value = false;
}
</script>

<template>
  <v-card variant="text" max-width="800" class="pt-2 pb-2 ma-auto">
    <!-- Preview mode -->
    <v-card
      v-if="!editMode"
      class="journal-preview-card"
      variant="outlined"
      @dblclick="enterEditMode"
    >
      <v-card-text class="journal-preview-body">
        <v-icon class="journal-icon" size="small">mdi-pencil-outline</v-icon>
        <div
          v-if="hasContent"
          class="markdown-content"
          v-html="renderedContent"
        />
        <div v-else class="journal-placeholder">
          Double-click to write your thoughts...
        </div>
      </v-card-text>
    </v-card>

    <!-- Edit mode -->
    <v-card v-else class="journal-preview-card" variant="outlined">
      <v-card-text class="pb-0">
        <v-textarea
          v-model="editContent"
          auto-grow
          variant="plain"
          hide-details
          rows="4"
          autofocus
          class="journal-textarea"
        />
      </v-card-text>
      <v-card-actions class="justify-end pt-0">
        <v-btn color="primary" variant="tonal" size="small" @click="closeEditMode">
          {{ labels.close }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-card>
</template>

<style scoped>
.journal-preview-card {
  border-left: 4px solid rgb(var(--v-theme-warning)) !important;
  position: relative;
}

.journal-preview-body {
  cursor: pointer;
  min-height: 48px;
  padding-right: 36px !important;
}

.journal-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0.35;
  transition: opacity 0.15s;
}

.journal-preview-card:hover .journal-icon {
  opacity: 0.8;
}

.journal-placeholder {
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-style: italic;
  font-size: 0.9rem;
}

.markdown-content {
  font-size: 1rem;
}

.markdown-content :deep(p:last-child),
.markdown-content :deep(ul:last-child),
.markdown-content :deep(ol:last-child) {
  margin-block-end: 0;
}
</style>

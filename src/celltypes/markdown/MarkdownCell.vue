<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { marked } from "marked";

import { Locale, RENDERER_LABELS } from "@/i18n";
import type { Cell } from "@schemas/notebook";
import { notebookStore } from "@store/notebookStore";

const props = defineProps<{
  cell: Cell;
  locale: Locale | null;
  editMode?: boolean;
}>();

const labels = computed(() => RENDERER_LABELS[props.locale ?? "en-US"]);

const isEditing = ref(false);
const editContent = ref("");

watch(() => props.editMode, newVal => {
  if (!newVal && isEditing.value) closeEdit();
});

const toMarkdown = (source: string[] | undefined) => {
  if (!source) return "";
  return marked.parse(source.join(""));
};

const processedSource = computed(() => {
  const localizedSource = notebookStore.getLocalizedSource(props.cell.id, props.locale) || [];
  return notebookStore.parseGlobals(localizedSource, props.locale);
});

function enterEdit() {
  if (!props.editMode) return;
  editContent.value = (props.cell.source || []).join("");
  isEditing.value = true;
}

function closeEdit() {
  const lines = editContent.value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  notebookStore.setSource(props.cell.id, lines);
  isEditing.value = false;
}
</script>

<template>
  <v-card variant="text" max-width="800" class="pt-2 pb-2 ma-auto">
    <!-- Edit mode: textarea editor -->
    <template v-if="isEditing">
      <v-card-text>
        <v-textarea
          v-model="editContent"
          auto-grow
          variant="outlined"
          hide-details
          rows="4"
          autofocus
          density="compact"
        />
      </v-card-text>
      <v-card-actions class="pt-0 px-4 pb-3">
        <v-spacer />
        <v-btn variant="tonal" size="small" @click="closeEdit">{{ labels.close }}</v-btn>
      </v-card-actions>
    </template>

    <!-- View mode -->
    <template v-else>
      <div
        class="markdown-view"
        :class="{ 'markdown-editable': editMode }"
        @dblclick="enterEdit"
      >
        <v-icon
          v-if="editMode"
          class="markdown-edit-icon"
          size="small"
          @click.stop="enterEdit"
        >
          mdi-pencil-outline
        </v-icon>
        <v-card-text>
          <div class="markdown-content" v-html="toMarkdown(processedSource)" />
        </v-card-text>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.markdown-view {
  position: relative;
}

.markdown-editable {
  cursor: text;
  border-radius: 4px;
  transition: background 0.15s;
}

.markdown-editable:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.markdown-edit-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s;
  color: rgba(var(--v-theme-on-surface), 0.4);
  cursor: pointer;
}

.markdown-editable:hover .markdown-edit-icon {
  opacity: 1;
}

.markdown-content {
  font-size: 1.0rem;
}

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

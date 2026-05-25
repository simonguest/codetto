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
    <div
      v-if="!editMode"
      class="journal-card journal-lined"
      @dblclick="enterEditMode"
    >
      <v-icon class="journal-icon" size="small" @click.stop="enterEditMode">mdi-pencil-outline</v-icon>
      <div class="journal-body">
        <div
          v-if="hasContent"
          class="journal-text markdown-content"
          v-html="renderedContent"
        />
        <div v-else class="journal-text journal-placeholder">
          Double-click to write your thoughts...
        </div>
      </div>
    </div>

    <!-- Edit mode -->
    <div v-else class="journal-card journal-lined">
      <v-textarea
        v-model="editContent"
        auto-grow
        variant="plain"
        hide-details
        rows="4"
        autofocus
        class="journal-textarea"
      />
      <div class="journal-actions">
        <v-btn variant="tonal" size="small" class="journal-close-btn" @click="closeEditMode">
          {{ labels.close }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.journal-card {
  --line-h: 28px;
  --note-bg: #fef9c3;
  --note-shadow: 2px 4px 10px rgba(0, 0, 0, 0.18);
  --note-border: #f0e060;

  position: relative;
  background-color: var(--note-bg);
  border: 1px solid var(--note-border);
  border-radius: 2px;
  box-shadow: var(--note-shadow);
  font-family: "Inter", sans-serif;
  font-style: italic;
  color: #3a3010;
  cursor: pointer;
}

.journal-lined {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(var(--line-h) - 1px),
    var(--line-color) calc(var(--line-h) - 1px),
    var(--line-color) var(--line-h)
  );
}

.journal-body {
  padding: 12px 36px 12px 16px;
  min-height: 56px;
}

.journal-text {
  line-height: var(--line-h);
  font-size: 0.95rem;
}

.journal-placeholder {
  color: rgba(58, 48, 16, 0.45);
}

.journal-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #9a8520;
  opacity: 0.4;
  transition: opacity 0.15s;
}

.journal-card:hover .journal-icon {
  opacity: 0.75;
}

/* textarea in edit mode */
.journal-textarea :deep(.v-input__control),
.journal-textarea :deep(.v-field),
.journal-textarea :deep(.v-field__field) {
  background: transparent !important;
  box-shadow: none !important;
}

.journal-textarea :deep(.v-field__input) {
  font-family: "Inter", sans-serif !important;
  font-style: italic !important;
  font-size: 0.95rem !important;
  line-height: var(--line-h) !important;
  color: #3a3010 !important;
  padding: 12px 16px !important;
  min-height: calc(var(--line-h) * 4) !important;
  background: transparent !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
}

.journal-textarea :deep(.v-field__overlay),
.journal-textarea :deep(.v-field__outline),
.journal-textarea :deep(.v-field__underline),
.journal-textarea :deep(.v-field__loader) {
  display: none !important;
}

.journal-textarea :deep(textarea) {
  background: transparent !important;
  -webkit-mask-image: none !important;
  mask-image: none !important;
}

.journal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 4px 12px 10px;
}

.journal-close-btn {
  background-color: rgba(0, 0, 0, 0.1) !important;
  color: #000 !important;
}

/* markdown inside journal */
.markdown-content :deep(p),
.markdown-content :deep(li) {
  line-height: var(--line-h);
  margin: 0;
}

.markdown-content :deep(p + p) {
  margin-top: var(--line-h);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  line-height: var(--line-h);
  margin: 0 0 var(--line-h);
}
</style>

<script setup lang="ts">
import { onMounted, watch, computed, ref } from "vue";

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
import CfuCell from "@celltypes/cfu";
import InputDialog from "@components/InputDialog.vue";
import InsertBar from "@components/InsertBar.vue";

const props = defineProps<{
  id: string;
  initialNotebook: Notebook;
  theme: Theme;
  locale: Locale;
  editMode: boolean;
}>();

onMounted(() => {
  notebookStore.loadNotebook(props.initialNotebook);
  pyodideStore.resetGlobals();
});

watch(
  () => props.initialNotebook,
  newNotebook => {
    notebookStore.loadNotebook(newNotebook);
  }
);

const rendererLabels = computed(() => RENDERER_LABELS[props.locale]);

// Delete confirmation
const deleteDialogOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);

function requestDelete(cellId: string) {
  pendingDeleteId.value = cellId;
  deleteDialogOpen.value = true;
}

function confirmDelete() {
  if (pendingDeleteId.value) notebookStore.deleteCell(pendingDeleteId.value);
  deleteDialogOpen.value = false;
  pendingDeleteId.value = null;
}

function cancelDelete() {
  deleteDialogOpen.value = false;
  pendingDeleteId.value = null;
}

function handleInsert(cellType: string, insertAfterCellId: string | null) {
  notebookStore.addCell(cellType, insertAfterCellId);
}
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

    <!-- Insert bar before all cells -->
    <InsertBar
      v-if="editMode"
      :insert-after-cell-id="null"
      :locale="props.locale"
      @insert="handleInsert"
    />

    <template v-for="(cell, index) in notebookStore.content.cells" :key="cell.id">
      <template v-if="!cell.metadata.tags?.includes('hidden')">
      <!-- Per-cell toolbar in edit mode -->
      <div v-if="editMode" class="cell-toolbar">
        <v-btn
          size="x-small"
          variant="text"
          icon="mdi-arrow-up"
          :disabled="index === 0"
          @click="notebookStore.moveCellUp(cell.id)"
        />
        <v-btn
          size="x-small"
          variant="text"
          icon="mdi-arrow-down"
          :disabled="index === notebookStore.content.cells.length - 1"
          @click="notebookStore.moveCellDown(cell.id)"
        />
        <v-spacer />
        <v-btn
          size="x-small"
          variant="text"
          icon="mdi-delete-outline"
          color="error"
          @click="requestDelete(cell.id)"
        />
      </div>

      <!-- Cell (outlined in edit mode) -->
      <div :class="editMode ? 'cell-edit-outline' : ''">
        <MarkdownCell
          v-if="cell.cell_type === 'markdown' && !cell.metadata.tags?.includes('journal')"
          :cell="cell"
          :metadata="cell.metadata"
          :locale="props.locale"
          :edit-mode="editMode"
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
        <CfuCell
          v-if="cell.cell_type === 'raw' && cell.metadata.tags?.includes('cfu')"
          :cell="cell"
          :locale="props.locale"
          :edit-mode="editMode"
        />
      </div>

      <!-- Insert bar after each cell -->
      <InsertBar
        v-if="editMode"
        :insert-after-cell-id="cell.id"
        :locale="props.locale"
        @insert="handleInsert"
      />
      </template>
    </template>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="340">
      <v-card>
        <v-card-title class="text-body-1 font-weight-medium pt-5 px-5">
          {{ rendererLabels.deleteCellTitle }}
        </v-card-title>
        <v-card-text class="px-5 pb-2 text-medium-emphasis">
          {{ rendererLabels.deleteCellMessage }}
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="cancelDelete">{{ rendererLabels.cancel }}</v-btn>
          <v-btn color="error" variant="elevated" size="small" @click="confirmDelete">
            {{ rendererLabels.deleteConfirm }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

<style scoped>
.cell-toolbar {
  max-width: 800px;
  margin: 8px auto 0;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
}

.cell-edit-outline {
  outline: 1px dashed rgba(var(--v-border-color), 0.35);
  border-radius: 6px;
}
</style>

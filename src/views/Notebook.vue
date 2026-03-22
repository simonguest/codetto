<script setup lang="ts">
import { computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { notebookStore } from "@store/notebookStore";
import { fileStore } from "@store/fileStore";
import { NOTEBOOK_LABELS, LOCALE_METADATA } from "@/i18n";
import { useNotebookAutoSave } from "@composables/useNotebookAutoSave";

import Renderer from "@/Renderer.vue";

const router = useRouter();

const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);
const isRTL = computed(() => LOCALE_METADATA[settingsStore.locale].direction === "rtl");

const filename = computed(() => {
  if (!fileStore.filePath) return null;
  return fileStore.filePath.split("/").pop() || fileStore.filePath.split("\\").pop() || null;
});

const hasNotebook = computed(() => notebookStore.content?.cells?.length > 0);

const { saveStatus, saveNow, stopWatcher } = useNotebookAutoSave();

const goBack = async () => {
  if (notebookStore.content?.cells?.length > 0) {
    await saveNow(notebookStore.content);
  }
  router.push("/");
};

onUnmounted(() => {
  notebookStore.clear();
  fileStore.filePath = null;
  stopWatcher();
});
</script>

<template>
  <div class="notebook">
    <!-- Sticky header -->
    <div class="notebook-header" :class="{ 'notebook-header-rtl': isRTL }">
      <v-btn
        :icon="isRTL ? 'mdi-arrow-right' : 'mdi-arrow-left'"
        variant="text"
        @click="goBack"
      ></v-btn>

      <h1 class="text-h6 notebook-title">
        {{ filename || notebookLabels.untitledNotebook }}
      </h1>

      <!-- Save status indicator -->
      <v-chip
        v-if="saveStatus !== 'idle'"
        :color="saveStatus === 'saved' ? 'success' : saveStatus === 'saving' ? 'info' : 'error'"
        size="small"
        variant="tonal"
      >
        <v-icon
          :icon="
            saveStatus === 'saved'
              ? 'mdi-check'
              : saveStatus === 'saving'
              ? 'mdi-loading'
              : 'mdi-alert'
          "
          :class="{ 'mdi-spin': saveStatus === 'saving' }"
          size="small"
          class="me-1"
        ></v-icon>
        {{
          saveStatus === "saved"
            ? notebookLabels.saved
            : saveStatus === "saving"
            ? notebookLabels.saving
            : notebookLabels.saveError
        }}
      </v-chip>
    </div>

    <!-- Scrollable content -->
    <div class="notebook-content">
      <v-container fluid class="pa-4">
        <Renderer
          v-if="hasNotebook"
          :initial-notebook="notebookStore.content"
          :id="fileStore.filePath || 'notebook'"
          :theme="settingsStore.theme"
          :locale="settingsStore.locale"
        />

        <v-card v-else class="pa-6">
          <div class="text-center">
            <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4"></v-icon>
            <h2 class="text-h5 mb-2">{{ notebookLabels.failedToLoad }}</h2>
            <v-btn color="primary" @click="goBack">
              {{ notebookLabels.backToNotebooks }}
            </v-btn>
          </div>
        </v-card>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.notebook {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.notebook-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.notebook-header-rtl {
  flex-direction: row-reverse;
}

.notebook-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html[dir="rtl"] .notebook-title {
  text-align: right;
}

html[dir="ltr"] .notebook-title {
  text-align: left;
}

.notebook-content {
  flex: 1;
  overflow-y: auto;
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

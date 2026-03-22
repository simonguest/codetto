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

const showResources = computed(() => false);

onUnmounted(() => {
  notebookStore.clear();
  fileStore.filePath = null;
  stopWatcher();
});
</script>

<template>
  <div class="notebook">
    <v-container fluid class="pa-4">
      <!-- Header with back button and save status -->
      <div class="d-flex align-center mb-6 notebook-header">
        <div class="d-flex align-center flex-grow-1">
          <v-btn
            :icon="isRTL ? 'mdi-arrow-right' : 'mdi-arrow-left'"
            variant="text"
            @click="goBack"
            :class="isRTL ? 'ms-3' : 'me-3'"
          ></v-btn>
          <h1 class="text-h4 notebook-title">
            {{ filename || notebookLabels.untitledNotebook }}
          </h1>
        </div>

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

      <!-- Notebook Renderer -->
      <Renderer
        v-if="hasNotebook"
        :initial-notebook="notebookStore.content"
        :id="fileStore.filePath || 'notebook'"
        :theme="settingsStore.theme"
        :locale="settingsStore.locale"
      />

      <!-- No notebook loaded -->
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
</template>

<style scoped>
.notebook {
  height: 100%;
  width: 100%;
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* RTL-aware header layout */
.notebook-header {
  flex-direction: row;
}

html[dir="rtl"] .notebook-header {
  flex-direction: row-reverse;
}

/* RTL-aware title alignment */
html[dir="rtl"] .notebook-title {
  text-align: right;
}

html[dir="ltr"] .notebook-title {
  text-align: left;
}

/* RTL-aware back button positioning */
html[dir="rtl"] .notebook .v-btn {
  margin-left: 12px;
  margin-right: 0;
}

html[dir="ltr"] .notebook .v-btn {
  margin-right: 12px;
  margin-left: 0;
}
</style>

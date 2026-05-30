<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { notebookStore } from "@store/notebookStore";
import { pyodideStore } from "@store/pyodideStore";
import { NOTEBOOK_LABELS, LOCALE_METADATA } from "@/i18n";
import { getNotebook } from "@storage/notebookStorage";
import { useNotebookAutoSave } from "@composables/useNotebookAutoSave";
import type { Notebook } from "@schemas/notebook";

import Renderer from "@/Renderer.vue";

const route = useRoute();
const router = useRouter();

const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);
const isRTL = computed(() => LOCALE_METADATA[settingsStore.locale].direction === "rtl");

const notebookId = computed(() => route.params.id as string);

const notebook = ref<Notebook | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const showResources = ref(false);

const { saveStatus, stopWatcher } = useNotebookAutoSave(notebookId.value);

onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    notebook.value = await getNotebook(notebookId.value);
  } catch (err) {
    console.error("Failed to load notebook:", err);
    error.value = err instanceof Error ? err.message : "Failed to load notebook";
  } finally {
    loading.value = false;
  }
});

const goBack = () => {
  const raw = notebook.value?.metadata?.folder;
  const folder = raw && !raw.startsWith('/') ? `/${raw}` : raw;
  router.push(folder ? { name: 'notebooks', query: { folder } } : '/notebooks');
};

const toggleResources = () => {
  showResources.value = !showResources.value;
};

onUnmounted(() => {
  if (pyodideStore.executionStatus !== "idle") {
    pyodideStore.interruptExecution();
  }
  notebookStore.clear();
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
        {{ notebook?.metadata?.title || notebookLabels.untitledNotebook }}
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

      <v-btn
        icon="mdi-paperclip"
        variant="text"
        size="small"
        :color="showResources ? 'primary' : 'default'"
        @click="toggleResources"
      >
        <v-icon>mdi-paperclip</v-icon>
        <v-tooltip activator="parent" location="bottom"> Resources </v-tooltip>
      </v-btn>
    </div>

    <!-- Scrollable content -->
    <div class="notebook-content">
      <v-container fluid class="pa-4">
        <!-- Notebook Renderer -->
        <Renderer
          v-if="notebook && !loading && !error"
          :initial-notebook="notebook"
          :id="notebookId"
          :theme="settingsStore.theme"
          :locale="settingsStore.locale"
        />

        <!-- Loading state -->
        <div v-else-if="loading" class="loading">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>{{ notebookLabels.loadingNotebook }}</p>
        </div>

        <!-- Error state -->
        <v-card v-else-if="error" class="pa-6">
          <div class="text-center">
            <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4"></v-icon>
            <h2 class="text-h5 mb-2">{{ notebookLabels.failedToLoad }}</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">
              {{ error }}
            </p>
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
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-shrink: 0;
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
  min-height: 0;
  overscroll-behavior: contain;
  padding-bottom: 32px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 16px;
}

.mdi-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

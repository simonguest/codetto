<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { notebookStore } from "@store/notebookStore";
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
  router.push("/notebooks");
};

const toggleResources = () => {
  showResources.value = !showResources.value;
};

onUnmounted(() => {
  // Clear the notebook store and stop watching for auto-save changes
  notebookStore.clear();
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
            {{ notebook?.metadata?.title || notebookLabels.untitledNotebook }}
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

        <div class="d-flex align-center" :class="isRTL ? 'ms-3' : 'me-3'">
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
      </div>

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
</template>

<style scoped>
.notebook {
  height: 100%;
  width: 100%;
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

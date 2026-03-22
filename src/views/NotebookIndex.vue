<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { notebookStore } from "@store/notebookStore";
import { fileStore } from "@store/fileStore";
import { NOTEBOOK_LABELS } from "@/i18n";
import { openNotebookFile } from "@/services/fileService";

const router = useRouter();
const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);

const loading = ref(false);
const error = ref<string | null>(null);

const openFile = async () => {
  try {
    loading.value = true;
    error.value = null;

    const result = await openNotebookFile();
    if (!result) return; // user cancelled

    fileStore.filePath = result.path;
    notebookStore.loadNotebook(result.notebook);
    router.push("/notebook");
  } catch (err) {
    console.error("Failed to open notebook:", err);
    error.value = err instanceof Error ? err.message : "Failed to open notebook";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="open-screen">
    <div class="open-screen-content">
      <v-icon icon="mdi-notebook-outline" size="80" color="primary" class="mb-6"></v-icon>
      <h1 class="text-h4 mb-2">{{ notebookLabels.title }}</h1>
      <p class="text-body-1 text-medium-emphasis mb-8">
        {{ notebookLabels.openFileHint }}
      </p>

      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-folder-open"
        :loading="loading"
        @click="openFile"
      >
        {{ notebookLabels.openFile }}
      </v-btn>

      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mt-6"
        max-width="400"
      >
        {{ error }}
      </v-alert>
    </div>
  </div>
</template>

<style scoped>
.open-screen {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.open-screen-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px;
}
</style>

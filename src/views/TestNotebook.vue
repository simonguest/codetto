<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { notebookStore } from "@store/notebookStore";
import type { Notebook } from "@schemas/notebook";

import Renderer from "@/Renderer.vue";

const route = useRoute();
const filename = computed(() => route.params.filename as string);
const editMode = computed(() => route.query.edit === 'true');

const notebook = ref<Notebook | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetch(`/test/${filename.value}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    notebook.value = await response.json();
  } catch (err) {
    console.error("Failed to load test notebook:", err);
    error.value = err instanceof Error ? err.message : "Failed to load notebook";
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  notebookStore.clear();
});
</script>

<template>
  <div class="notebook">
    <div class="notebook-content">
      <v-container fluid class="pa-4">
        <Renderer
          v-if="notebook && !loading && !error"
          :initial-notebook="notebook"
          :id="filename"
          :theme="settingsStore.theme"
          :locale="settingsStore.locale"
          :edit-mode="editMode"
        />

        <div v-else-if="loading" class="loading">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading notebook…</p>
        </div>

        <v-card v-else-if="error" class="pa-6">
          <div class="text-center">
            <v-icon icon="mdi-alert-circle" size="64" color="error" class="mb-4"></v-icon>
            <h2 class="text-h5 mb-2">Failed to load test notebook</h2>
            <p class="text-body-1 text-medium-emphasis mb-4">{{ error }}</p>
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

.notebook-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
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
</style>

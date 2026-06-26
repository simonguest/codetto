<script setup lang="ts">
import { ref, computed } from "vue";
import { notebookStore, MAX_FILE_SIZE, MAX_TOTAL_SIZE } from "@store/notebookStore";
import type { NotebookFile } from "@schemas/notebook";
import { NOTEBOOK_LABELS } from "@/i18n";
import { settingsStore } from "@store/settingsStore";

const labels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);

const fileInput = ref<HTMLInputElement | null>(null);
const errorMsg = ref<string | null>(null);

const files = computed<NotebookFile[]>(() => notebookStore.content.metadata?.files ?? []);

const totalSize = computed(() => files.value.reduce((sum, f) => sum + f.size, 0));

const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp", "image/bmp",
  "audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/ogg", "audio/mp4",
  "audio/flac", "audio/x-flac", "audio/aac",
  "text/csv", "text/plain", "application/json",
]);

function mimeTypeIcon(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "mdi-image";
  if (mimeType.startsWith("audio/")) return "mdi-music";
  if (mimeType === "text/csv") return "mdi-file-delimited";
  if (mimeType === "application/json") return "mdi-code-json";
  return "mdi-file-document";
}

function sanitizeName(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "") || "file";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function triggerFileInput() {
  errorMsg.value = null;
  fileInput.value?.click();
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  errorMsg.value = null;

  if (!ALLOWED_TYPES.has(file.type)) {
    errorMsg.value = labels.value.filesErrorType;
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    errorMsg.value = labels.value.filesErrorSize;
    return;
  }

  const data = await readAsBase64(file);
  const name = sanitizeName(file.name);

  const result = notebookStore.addFile({ name, mimeType: file.type, size: file.size, data });
  if (!result.success) {
    errorMsg.value = result.error === "total_too_large"
      ? labels.value.filesErrorTotal
      : labels.value.filesErrorSize;
  }
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeFile(name: string) {
  errorMsg.value = null;
  notebookStore.removeFile(name);
}
</script>

<template>
  <div class="resources-panel">
    <div class="resources-section-header">
      <span class="text-caption text-medium-emphasis resources-section-label">{{ labels.filesSection }}</span>
      <span v-if="files.length > 0" class="text-caption text-medium-emphasis">
        {{ formatSize(totalSize) }} / {{ formatSize(MAX_TOTAL_SIZE) }}
      </span>
      <v-btn
        prepend-icon="mdi-plus"
        variant="tonal"
        size="x-small"
        @click="triggerFileInput"
      >
        {{ labels.filesAdd }}
      </v-btn>
    </div>

    <v-alert
      v-if="errorMsg"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="resources-error"
      @click:close="errorMsg = null"
    >
      {{ errorMsg }}
    </v-alert>

    <div v-if="files.length === 0" class="resources-empty text-caption text-medium-emphasis">
      {{ labels.filesEmpty }}
    </div>

    <div v-else class="resources-file-list">
      <div v-for="file in files" :key="file.name" class="resources-file-item">
        <v-icon :icon="mimeTypeIcon(file.mimeType)" size="small" color="medium-emphasis" />
        <span class="resources-file-name text-body-2">{{ file.name }}</span>
        <span class="resources-file-size text-caption text-medium-emphasis">{{ formatSize(file.size) }}</span>
        <v-btn variant="text" size="x-small" @click="removeFile(file.name)">
          <v-icon size="small">mdi-close</v-icon>
          <v-tooltip activator="parent" location="left">Remove</v-tooltip>
        </v-btn>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      class="d-none"
      accept="image/*,audio/*,text/csv,text/plain,application/json"
      @change="onFileSelected"
    />
  </div>
</template>

<style scoped>
.resources-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  gap: 8px;
}

.resources-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.resources-section-label {
  font-weight: 600;
  letter-spacing: 0.5px;
  flex: 1;
}

.resources-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
  font-style: italic;
  line-height: 1.6;
}

.resources-file-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.resources-file-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: 4px;
}

.resources-file-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.resources-file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.resources-file-size {
  flex-shrink: 0;
}

.resources-error {
  flex-shrink: 0;
}

</style>

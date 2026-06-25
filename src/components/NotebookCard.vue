<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS } from "@/i18n";
import { getNotebook } from "@storage/notebookStorage";
import type { NotebookInfo } from "@storage/notebookStorage";

interface Props {
  notebook: NotebookInfo;
}

interface Emits {
  (e: 'delete', notebookId: string): void;
  (e: 'rename', notebookId: string, newTitle: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();

const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);

const formatDate = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return notebookLabels.value.justNow;
  } else if (diffInHours < 24) {
    const hourLabel = diffInHours === 1 ? notebookLabels.value.hourAgo : notebookLabels.value.hoursAgo;
    return `${diffInHours} ${hourLabel}`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    const dayLabel = diffInDays === 1 ? notebookLabels.value.dayAgo : notebookLabels.value.daysAgo;
    return `${diffInDays} ${dayLabel}`;
  }
};

const formattedDate = computed(() =>
  formatDate(props.notebook.lastModified || props.notebook.created)
);

const isLight = computed(() => settingsStore.theme === 'light');
const cardBg = computed(() => isLight.value ? '#dce9f8' : '#1a2038');
const cardColor = computed(() => props.notebook.color || '#42a5f5');
const imageSrc = computed(() =>
  props.notebook.image ||
  (isLight.value ? '/notebook-placeholder-light.svg' : '/notebook-placeholder.svg')
);

const openNotebook = () => {
  router.push(`/notebooks/${props.notebook.id}`);
};

const showRenameDialog = ref(false);
const renameTitle = ref('');

const openRenameDialog = () => {
  renameTitle.value = props.notebook.title;
  showRenameDialog.value = true;
};

const confirmRename = () => {
  const trimmed = renameTitle.value.trim();
  if (trimmed) {
    showRenameDialog.value = false;
    emit('rename', props.notebook.id, trimmed);
  }
};

const showDeleteDialog = ref(false);

const confirmDelete = () => {
  showDeleteDialog.value = false;
  emit('delete', props.notebook.id);
};

const downloadNotebook = async () => {
  const notebook = await getNotebook(props.notebook.id);
  const json = JSON.stringify(notebook, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.notebook.title}.ipynb`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<template>
  <v-card
    :class="['notebook-card', { 'is-light': isLight }]"
    :style="{ '--card-color': cardColor, '--card-bg': cardBg }"
    rounded="xl"
    @click="openNotebook"
  >
    <!-- Image area -->
    <div class="card-image-area">
      <img :src="imageSrc" class="card-bg" alt="" />
      <div class="card-image-fade" />
      <div class="card-menu-overlay" @click.stop>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              v-bind="props"
              color="white"
            />
          </template>
          <v-list>
            <v-list-item @click="openRenameDialog">
              <v-list-item-title>{{ notebookLabels.rename }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="downloadNotebook">
              <v-list-item-title>{{ notebookLabels.download }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="showDeleteDialog = true">
              <v-list-item-title>{{ notebookLabels.delete }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Info area -->
    <div class="card-info-area">
      <p class="card-title">{{ notebook.title }}</p>
      <p v-if="notebook.description" class="card-description">{{ notebook.description }}</p>
      <div class="card-footer">
        <span class="card-timestamp">
          <v-icon size="13" class="me-1">mdi-clock-outline</v-icon>
          {{ notebookLabels.lastEdited }}: {{ formattedDate }}
        </span>
        <div v-if="notebook.progress !== undefined" class="card-progress">
          <v-progress-circular
            :model-value="notebook.progress"
            size="20"
            width="2.5"
            color="success"
          />
          <span class="progress-label">{{ notebook.progress }}%</span>
        </div>
      </div>
    </div>
  </v-card>

  <!-- Rename dialog -->
  <v-dialog v-model="showRenameDialog" max-width="400" @click:outside="showRenameDialog = false">
    <v-card>
      <v-card-title>{{ notebookLabels.renameDialogTitle }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="renameTitle"
          :label="notebookLabels.renameDialogLabel"
          autofocus
          @keyup.enter="confirmRename"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showRenameDialog = false">{{ notebookLabels.deleteCancel }}</v-btn>
        <v-btn color="primary" @click="confirmRename" :disabled="!renameTitle.trim()">{{ notebookLabels.renameSave }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="showDeleteDialog" max-width="400" @click:outside="showDeleteDialog = false">
    <v-card>
      <v-card-title>{{ notebookLabels.deleteConfirmTitle }}</v-card-title>
      <v-card-text>{{ notebookLabels.deleteConfirmMessage }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="showDeleteDialog = false">{{ notebookLabels.deleteCancel }}</v-btn>
        <v-btn color="error" @click="confirmDelete">{{ notebookLabels.deleteConfirm }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.notebook-card {
  cursor: pointer;
  height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--card-bg) !important;
  border-left: 4px solid var(--card-color) !important;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.notebook-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45) !important;
}

/* Image section */
.card-image-area {
  position: relative;
  height: 90px;
  flex-shrink: 0;
  overflow: hidden;
}

.card-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Gradient fade at the bottom of the image into the info area */
.card-image-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: linear-gradient(to bottom, transparent, var(--card-bg));
  pointer-events: none;
}

.card-menu-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
}

/* Info section */
.card-info-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 14px 12px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 3px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-description {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.55);
  margin: 0 0 4px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-timestamp {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
}

.card-progress {
  display: flex;
  align-items: center;
  gap: 5px;
}

.progress-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

/* Light theme overrides */
.notebook-card.is-light .card-title {
  color: rgba(0, 0, 0, 0.85);
}

.notebook-card.is-light .card-description {
  color: rgba(0, 0, 0, 0.55);
}

.notebook-card.is-light .card-timestamp {
  color: rgba(0, 0, 0, 0.45);
}

.notebook-card.is-light .progress-label {
  color: rgba(0, 0, 0, 0.7);
}
</style>

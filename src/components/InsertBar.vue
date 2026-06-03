<script setup lang="ts">
import { computed } from 'vue';
import type { Locale } from '@/i18n';
import { RENDERER_LABELS } from '@/i18n';

const props = defineProps<{
  insertAfterCellId: string | null;
  locale: Locale;
}>();

const emit = defineEmits<{
  insert: [cellType: string, insertAfterCellId: string | null];
}>();

const labels = computed(() => RENDERER_LABELS[props.locale]);
</script>

<template>
  <div class="insert-bar">
    <div class="insert-bar-line" />
    <v-menu location="bottom center">
      <template #activator="{ props: menuProps }">
        <v-btn
          v-bind="menuProps"
          size="x-small"
          variant="tonal"
          rounded
          prepend-icon="mdi-plus"
          class="insert-bar-btn"
        >
          {{ labels.addCell }}
        </v-btn>
      </template>
      <v-list density="compact" min-width="210">
        <v-list-item
          prepend-icon="mdi-text"
          :title="labels.insertMarkdown"
          @click="emit('insert', 'markdown', insertAfterCellId)"
        />
        <v-list-item
          prepend-icon="mdi-code-tags"
          :title="labels.insertCode"
          @click="emit('insert', 'code', insertAfterCellId)"
        />
        <v-list-item
          prepend-icon="mdi-notebook-outline"
          :title="labels.insertJournal"
          @click="emit('insert', 'journal', insertAfterCellId)"
        />
        <v-list-item
          prepend-icon="mdi-help-circle-outline"
          :title="labels.insertCfu"
          @click="emit('insert', 'cfu', insertAfterCellId)"
        />
      </v-list>
    </v-menu>
    <div class="insert-bar-line" />
  </div>
</template>

<style scoped>
.insert-bar {
  display: flex;
  align-items: center;
  max-width: 800px;
  margin: 2px auto;
  gap: 8px;
  padding: 0 16px;
}

.insert-bar-line {
  flex: 1;
  height: 1px;
  background: rgba(var(--v-border-color), var(--v-border-opacity));
}

.insert-bar-btn {
  flex-shrink: 0;
  font-size: 0.7rem;
}
</style>

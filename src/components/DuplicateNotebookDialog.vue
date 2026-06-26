<script setup lang="ts">
import { computed } from "vue";
import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS } from "@/i18n";
import type { NotebookInfo } from "@storage/notebookStorage";

const props = defineProps<{
  show: boolean;
  existing: NotebookInfo | null;
}>();

const emit = defineEmits<{
  "open-existing": [];
  "import-new": [];
  cancel: [];
}>();

const labels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);

const message = computed(() => {
  const title = props.existing?.title ?? '';
  return labels.value.duplicateMessage.replace('{title}', title);
});
</script>

<template>
  <v-dialog :model-value="show" max-width="440px" persistent>
    <v-card>
      <v-card-title class="text-body-1 font-weight-medium pt-5 px-5">
        {{ labels.duplicateTitle }}
      </v-card-title>
      <v-card-text class="px-5 pb-2">
        <p>{{ message }}</p>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-btn variant="text" @click="emit('cancel')">
          {{ labels.deleteCancel }}
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="emit('import-new')">
          {{ labels.duplicateImportNew }}
        </v-btn>
        <v-btn color="primary" variant="elevated" size="small" @click="emit('open-existing')">
          {{ labels.duplicateOpenExisting }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

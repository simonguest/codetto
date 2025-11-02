<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

import { settingsStore } from "@store/settingsStore";
import { NOTEBOOK_LABELS } from "@/i18n";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [url: string];
}>();

// Get notebook labels based on current locale
const notebookLabels = computed(() => NOTEBOOK_LABELS[settingsStore.locale]);

// Dialog state
const userInput = ref<string>("");
const inputFieldRef = ref();
const errorMessage = ref<string>("");

// Dialog methods
const submitInput = () => {
  const url = userInput.value.trim();
  
  if (!url) {
    errorMessage.value = notebookLabels.value.urlDialogInvalidUrl;
    return;
  }
  
  // Basic URL validation
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      errorMessage.value = notebookLabels.value.urlDialogInvalidUrl;
      return;
    }
  } catch {
    errorMessage.value = notebookLabels.value.urlDialogInvalidUrl;
    return;
  }
  
  errorMessage.value = "";
  emit('submit', url);
  userInput.value = "";
};

const cancelInput = () => {
  emit('cancel');
  userInput.value = "";
  errorMessage.value = "";
};

// Auto-focus input field when dialog opens
watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      inputFieldRef.value?.focus();
      errorMessage.value = "";
    }
  }
);

// Handle keyboard events
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitInput();
  } else if (event.key === "Escape") {
    event.preventDefault();
    cancelInput();
  }
};

// Clear error when user types
watch(userInput, () => {
  if (errorMessage.value) {
    errorMessage.value = "";
  }
});
</script>

<template>
  <v-dialog :model-value="show" max-width="500px" persistent @keydown="handleKeydown">
    <v-card>
      <v-card-title>{{ notebookLabels.urlDialogTitle }}</v-card-title>
      <v-card-text>
        <v-text-field
          ref="inputFieldRef"
          v-model="userInput"
          :label="notebookLabels.urlDialogLabel"
          :error-messages="errorMessage"
          variant="outlined"
          density="compact"
          placeholder="https://example.com/notebook.ipynb"
          @keydown="handleKeydown"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="cancelInput">
          {{ notebookLabels.urlDialogCancel }}
        </v-btn>
        <v-btn color="primary" variant="text" @click="submitInput">
          {{ notebookLabels.urlDialogOpen }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

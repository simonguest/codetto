<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";

import { pyodideStore } from "@store/pyodideStore";
import { RENDERER_LABELS, type Locale } from "@/i18n";

const props = defineProps<{
  locale?: Locale;
}>();

// Get renderer labels based on current locale
const rendererLabels = computed(() => RENDERER_LABELS[props.locale || 'en-US']);

// Dialog state
const userInput = ref<string>("");
const inputFieldRef = ref();
const showDialog = computed({
  get: () => pyodideStore.inputStatus === "waiting",
  set: (value: boolean) => {
    if (!value) {
      pyodideStore.inputStatus = "idle";
    }
  }
});

// Dialog methods
const submitInput = () => {
  pyodideStore.submitUserInput(userInput.value);
  userInput.value = "";
};

const cancelInput = () => {
  pyodideStore.submitUserInput(""); // Send an empty string as per the Jupyter specification
  userInput.value = "";
};

// Auto-focus input field when dialog opens
watch(
  () => showDialog.value,
  async (isOpen) => {
    if (isOpen) {
      await nextTick();
      inputFieldRef.value?.focus();
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
</script>

<template>
  <v-dialog v-model="showDialog" max-width="400px" persistent @keydown="handleKeydown">
    <v-card>
      <v-card-title>{{ pyodideStore.inputPrompt || rendererLabels.inputDialogTitle }}</v-card-title>
      <v-card-text>
        <v-text-field
          ref="inputFieldRef"
          v-model="userInput"
          :label="rendererLabels.inputDialogLabel"
          variant="outlined"
          density="compact"
          @keydown="handleKeydown"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="cancelInput">{{ rendererLabels.inputDialogCancel }}</v-btn>
        <v-btn color="primary" variant="text" @click="submitInput">{{ rendererLabels.inputDialogSubmit }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

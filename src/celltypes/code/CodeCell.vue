<script setup lang="ts">
import { ref, watch, computed } from "vue";

import type { Cell } from "@schemas/notebook";
import { notebookStore, OutputType } from "@store/notebookStore";
import { Theme } from "@/theme";
import { Locale } from "@/i18n";

import CodeControls from "./CodeControls.vue";
import CodeEditor from "./CodeEditor.vue";
import Console from "./Console.vue";
import Error from "./Error.vue";
import Result from "./Result.vue";
import ParameterControls from "./ParameterControls.vue";

const props = defineProps<{
  cell: Cell;
  theme: Theme;
  locale: Locale | null;
}>();

let outputTypes: OutputType[] = [];
outputTypes = notebookStore.getOutputTypes(props.cell.id);

const getDefaultTab = () => {
  if (outputTypes.indexOf("error") !== -1) return "error";
  if (outputTypes.indexOf("result") !== -1) return "result";
  if (outputTypes.indexOf("stdout") !== -1) return "stdout";
};

const outputTab = ref(getDefaultTab() ?? "result");

// Track which output types we've already seen to avoid resetting the active tab
// when only the content of an existing type updates (e.g. new stdout lines arriving
// while the user is viewing the stdout tab).
let knownOutputTypes = new Set<string>(outputTypes);

watch(
  () => props.cell.outputs,
  () => {
    const newTypes = notebookStore.getOutputTypes(props.cell.id);
    const newTypeSet = new Set(newTypes);
    const typesChanged =
      newTypes.some(t => !knownOutputTypes.has(t)) ||
      [...knownOutputTypes].some(t => !newTypeSet.has(t));
    outputTypes = newTypes;
    if (typesChanged) {
      knownOutputTypes = newTypeSet;
      outputTab.value = "none";
      outputTab.value = getDefaultTab() ?? "none";
    }
  },
  { deep: true }
);

// Handle parameter changes
const handleParameterChange = (newSource: string[]) => {
  // Directly update the cell source without going through setSource
  // to avoid the automatic newline addition
  const cell = notebookStore.findCell(props.cell.id);
  if (cell) {
    cell.source = newSource;
    notebookStore.updated = Date.now();
  }
};

// Check if code should be hidden
const isCodeHidden = computed(() => {
  return notebookStore.hasTag(props.cell.id, "hide_code");
});

const hasOutputs = computed(() => {
  const cell = notebookStore.findCell(props.cell.id);
  return (cell?.outputs?.length ?? 0) > 0;
});

const clearOutputs = () => {
  notebookStore.clearOutputs(props.cell.id);
};

// Process source with localization and globals
const processedSource = computed(() => {
  // Force reactivity by accessing props.locale in the computed
  const locale = props.locale;
  const localizedSource = notebookStore.getLocalizedSource(props.cell.id, locale) || [];
  return notebookStore.parseGlobals(localizedSource, locale);
});
</script>

<template>
  <div>
    <!-- Parameter Controls -->
    <ParameterControls
      :source="processedSource"
      :cell-id="cell.id"
      @parameter-changed="handleParameterChange"
    />
    
    <!-- Code Cell -->
    <v-card
      max-width="800"
      variant="elevated"
      elevation="2"
      color="surface-light"
      class="mb-2 pt-2 pb-2 ma-auto rounded-lg"
    >
      <v-card-text v-if="!isCodeHidden">
        <CodeEditor :id="cell.id" :metadata="cell.metadata" :theme="props.theme" :locale="props.locale"/>
      </v-card-text>
      <v-card-actions class="pl-4 pr-4 d-flex justify-space-between">
        <CodeControls :id="cell.id" />
        <div class="d-flex align-center ml-auto">
          <v-tabs v-model="outputTab">
            <v-tab
              value="result"
              v-if="outputTypes.indexOf('result') !== -1"
              icon
              size="32"
              rounded="lg"
              min-width="48"
              ><v-icon icon="mdi-monitor"
            /></v-tab>
            <v-tab
              value="stdout"
              v-if="outputTypes.indexOf('stdout') !== -1"
              icon
              size="32"
              min-width="48"
              rounded="lg"
              ><v-icon icon="mdi-console"
            /></v-tab>
            <v-tab
              value="error"
              v-if="outputTypes.indexOf('error') !== -1"
              icon
              size="32"
              min-width="48"
              rounded="lg"
              ><v-icon icon="mdi-alert-circle-outline"
            /></v-tab>
          </v-tabs>
          <v-btn
            v-if="hasOutputs"
            size="32"
            icon="mdi-broom"
            @click="clearOutputs"
            class="ml-1 align-self-start"
          />
        </div>
      </v-card-actions>

      <v-card-text v-show="props.cell.outputs? props.cell.outputs.length > 0 : false">
        <v-tabs-window v-model="outputTab" :transition="false" :reverse-transition="false">
          <v-tabs-window-item value="result">
            <Result :value="notebookStore.getResult(cell.id)" :locale="props.locale" />
          </v-tabs-window-item>

          <v-tabs-window-item value="stdout">
            <Console :stdout="notebookStore.getStdout(cell.id)" />
          </v-tabs-window-item>

          <v-tabs-window-item value="error">
            <Error :stderr="notebookStore.getError(cell.id)" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
/* Kill the Vuetify v-window slide animation entirely */
:deep(.v-window-item) {
  transition: none !important;
  animation: none !important;
}
:deep(.v-window__container) {
  transition: none !important;
}
</style>

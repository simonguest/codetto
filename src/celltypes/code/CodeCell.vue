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
  if (outputTypes.indexOf("result") !== -1) return "result";
  if (outputTypes.indexOf("stdout") !== -1) return "stdout";
  if (outputTypes.indexOf("error") !== -1) return "error";
};

const outputTab = ref("result");

watch(
  () => props.cell.outputs,
  () => {
    // Get available output types for the cell and reset the tabs
    outputTypes = notebookStore.getOutputTypes(props.cell.id);
    outputTab.value = "none";
    outputTab.value = getDefaultTab() || outputTab.value;
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
        <v-tabs v-model="outputTab" class="ml-auto">
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
      </v-card-actions>

      <v-card-text v-show="props.cell.outputs? props.cell.outputs.length > 0 : false">
        <v-tabs-window v-model="outputTab" direction="vertical">
          <v-tabs-window-item value="result">
            <Result :value="notebookStore.getResult(cell.id)" :locale="props.locale" />
          </v-tabs-window-item>

          <v-tabs-window-item value="stdout" direction="vertical">
            <Console :stdout="notebookStore.getStdout(cell.id)" />
          </v-tabs-window-item>

          <v-tabs-window-item value="error" direction="vertical">
            <Error :stderr="notebookStore.getError(cell.id)" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>
    </v-card>
  </div>
</template>

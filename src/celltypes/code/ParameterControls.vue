<script setup lang="ts">
import { computed } from 'vue';

import { parseParameters, updateParameterInSource } from './parameterParser';
import type { Parameter } from './parameterTypes';

const props = defineProps<{
  source: string[] | undefined;
  cellId: string;
}>();

const emit = defineEmits<{
  'parameter-changed': [source: string[]];
}>();

// Parse parameters from source code
const parameters = computed(() => {
  return parseParameters(props.source);
});

// Handle parameter value changes
const handleParameterChange = (parameter: Parameter, newValue: any) => {
  if (!props.source) return;
  
  const updatedSource = updateParameterInSource(props.source, parameter, newValue);
  emit('parameter-changed', updatedSource);
};

// Format label for parameter
const formatLabel = (parameter: Parameter): string => {
  return parameter.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};
</script>

<template>
  <div v-if="parameters.length > 0" class="parameter-controls mb-4">
    <v-card variant="outlined" class="pa-4">
      <div class="parameter-grid">
        <div
          v-for="parameter in parameters"
          :key="parameter.name"
          class="parameter-item"
        >
          <!-- Value Parameter (text input) -->
          <v-text-field
            v-if="parameter.type === 'value'"
            :label="formatLabel(parameter)"
            :model-value="parameter.value"
            @update:model-value="(value) => handleParameterChange(parameter, value)"
            variant="outlined"
            density="compact"
            hide-details
          />
          
          <!-- Slider Parameter -->
          <div v-else-if="parameter.type === 'slider'" class="slider-container">
            <v-label class="text-caption mb-1">{{ formatLabel(parameter) }}</v-label>
            <div class="slider-layout">
              <v-slider
                :model-value="parameter.value"
                @update:model-value="(value) => handleParameterChange(parameter, value)"
                :min="parameter.config?.min ?? 0"
                :max="parameter.config?.max ?? 100"
                :step="parameter.config?.step ?? 1"
                thumb-label
                class="slider-control"
                hide-details
              />
              <v-text-field
                :model-value="parameter.value"
                readonly
                variant="outlined"
                density="compact"
                class="value-display"
                hide-details
              />
            </div>
          </div>
          
          <!-- Dropdown Parameter -->
          <v-select
            v-else-if="parameter.type === 'dropdown'"
            :label="formatLabel(parameter)"
            :model-value="parameter.value"
            @update:model-value="(value) => handleParameterChange(parameter, value)"
            :items="parameter.config?.options || []"
            variant="outlined"
            density="compact"
            hide-details
          />
          
          <!-- Boolean Parameter -->
          <div v-else-if="parameter.type === 'boolean'" class="boolean-container">
            <v-switch
              :model-value="parameter.value"
              @update:model-value="(value) => handleParameterChange(parameter, value)"
              :label="formatLabel(parameter)"
              color="primary"
              hide-details
              inset
            />
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.parameter-controls {
  max-width: 800px;
  margin: 0 auto;
}

.parameter-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item {
  min-width: 0; /* Prevent grid items from overflowing */
}

.slider-container {
  width: 100%;
}

.slider-layout {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-control {
  flex: 1;
  margin-top: 8px;
  margin-bottom: 8px;
}

.value-display {
  flex: 0 0 80px;
  width: 80px;
}

.boolean-container {
  display: flex;
  align-items: center;
  min-height: 40px; /* Match height of other controls */
}

/* Ensure consistent spacing */
.v-text-field,
.v-select {
  margin-bottom: 0;
}
</style>

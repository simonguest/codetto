<script setup lang="ts">
import { ref, computed, watch } from "vue";

import { notebookStore } from "@store/notebookStore";
import { RENDERER_LABELS, LOCALE_METADATA, type Locale } from "@/i18n";

const props = defineProps<{
  locale: Locale;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// Get renderer labels based on current locale
const rendererLabels = computed(() => RENDERER_LABELS[props.locale]);

// Dialog state
const showDialog = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

// Local state for editing
const localGlobals = ref<Record<string, Record<string, string>>>({});
const selectedVariable = ref<string | null>(null);
const newVariableName = ref("");
const showAddVariable = ref(false);

// Computed properties
const variableNames = computed(() => Object.keys(localGlobals.value).sort());

const selectedVariableData = computed(() => {
  if (!selectedVariable.value) return null;
  return localGlobals.value[selectedVariable.value] || {};
});

const usedLocalesInVariable = computed(() => {
  if (!selectedVariableData.value) return [];
  return Object.keys(selectedVariableData.value).filter(locale => locale !== 'default');
});

const availableLocales = computed(() => {
  const allLocales = Object.keys(LOCALE_METADATA);
  const usedInVariable = usedLocalesInVariable.value;
  return allLocales.filter(locale => !usedInVariable.includes(locale));
});

// Methods
const loadGlobals = () => {
  localGlobals.value = JSON.parse(JSON.stringify(notebookStore.getGlobals()));
  if (variableNames.value.length > 0 && !selectedVariable.value) {
    selectedVariable.value = variableNames.value[0];
  }
};

const selectVariable = (varName: string) => {
  selectedVariable.value = varName;
  showAddVariable.value = false;
};

const addVariable = () => {
  showAddVariable.value = true;
  newVariableName.value = "";
  selectedVariable.value = null;
};

const createVariable = () => {
  if (!newVariableName.value.trim()) return;
  
  // Validate variable name
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newVariableName.value)) {
    return; // Invalid variable name
  }
  
  if (localGlobals.value[newVariableName.value]) {
    return; // Variable already exists
  }
  
  localGlobals.value[newVariableName.value] = {
    default: ""
  };
  
  selectedVariable.value = newVariableName.value;
  showAddVariable.value = false;
  newVariableName.value = "";
};

const deleteVariable = () => {
  if (!selectedVariable.value) return;
  
  delete localGlobals.value[selectedVariable.value];
  
  // Select next available variable
  const remaining = variableNames.value;
  if (remaining.length > 0) {
    selectedVariable.value = remaining[0];
  } else {
    selectedVariable.value = null;
  }
};

const addLocale = (locale: string | null) => {
  if (!selectedVariable.value || !locale) return;
  
  if (!localGlobals.value[selectedVariable.value]) {
    localGlobals.value[selectedVariable.value] = {};
  }
  
  localGlobals.value[selectedVariable.value][locale] = "";
};

const removeLocale = (locale: string) => {
  if (!selectedVariable.value || locale === 'default') return;
  
  delete localGlobals.value[selectedVariable.value][locale];
};

const updateVariableName = (newName: string) => {
  if (!selectedVariable.value || !newName.trim()) return;
  
  // Validate variable name
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) {
    return;
  }
  
  if (newName === selectedVariable.value) return;
  
  if (localGlobals.value[newName]) {
    return; // Variable already exists
  }
  
  // Rename variable
  localGlobals.value[newName] = localGlobals.value[selectedVariable.value];
  delete localGlobals.value[selectedVariable.value];
  selectedVariable.value = newName;
};

const saveChanges = () => {
  // Update the notebook store with all changes
  Object.entries(localGlobals.value).forEach(([name, values]) => {
    notebookStore.setGlobal(name, values);
  });
  
  // Remove deleted variables
  const currentGlobals = notebookStore.getGlobals();
  Object.keys(currentGlobals).forEach(name => {
    if (!localGlobals.value[name]) {
      notebookStore.deleteGlobal(name);
    }
  });
  
  closeDialog();
};

const closeDialog = () => {
  showDialog.value = false;
  selectedVariable.value = null;
  showAddVariable.value = false;
};

const getLocaleDisplayName = (locale: string) => {
  if (locale === 'default') return 'Default';
  return LOCALE_METADATA[locale as Locale]?.name || locale;
};

// Watch for dialog opening
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    loadGlobals();
  }
});
</script>

<template>
  <v-dialog v-model="showDialog" max-width="900px" persistent>
    <v-card height="700px">
      <v-card-title class="d-flex align-center">
        <v-icon class="me-2">mdi-variable</v-icon>
        {{ rendererLabels.globalsDialogTitle }}
      </v-card-title>
      
      <v-card-text class="pa-0">
        <v-row no-gutters style="height: 580px;">
          <!-- Left Panel: Variables List -->
          <v-col cols="4" class="border-e">
            <div class="pa-3">
              <v-text-field
                v-if="showAddVariable"
                v-model="newVariableName"
                :label="rendererLabels.variableName"
                variant="outlined"
                density="compact"
                @keydown.enter="createVariable"
                @keydown.escape="showAddVariable = false"
                autofocus
              >
                <template #append-inner>
                  <v-btn
                    icon="mdi-check"
                    size="small"
                    variant="text"
                    @click="createVariable"
                  ></v-btn>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    @click="showAddVariable = false"
                  ></v-btn>
                </template>
              </v-text-field>
            </div>
            
            <v-list density="compact" class="px-2">
              <v-list-item
                v-for="varName in variableNames"
                :key="varName"
                :active="selectedVariable === varName"
                @click="selectVariable(varName)"
                rounded
              >
                <v-list-item-title>{{ varName }}</v-list-item-title>
              </v-list-item>
            </v-list>
            
            <div class="pa-3">
              <v-btn
                @click="addVariable"
                block
                variant="outlined"
                prepend-icon="mdi-plus"
                :disabled="showAddVariable"
              >
                {{ rendererLabels.addVariable }}
              </v-btn>
            </div>
          </v-col>
          
          <!-- Right Panel: Variable Editor -->
          <v-col cols="8">
            <div v-if="selectedVariable" class="pa-4 h-100">
              <div class="d-flex align-center">
                <v-text-field
                  :model-value="selectedVariable"
                  :label="rendererLabels.variableName"
                  variant="outlined"
                  density="compact"
                  class="me-2"
                  @update:model-value="updateVariableName"
                ></v-text-field>
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  variant="outlined"
                  size="small"
                  style="margin-top: -20px;"
                  @click="deleteVariable"
                ></v-btn>
              </div>
              
              <!-- Default Value -->
              <v-text-field
                v-model="localGlobals[selectedVariable]['default']"
                :label="rendererLabels.defaultValue"
                variant="outlined"
                density="compact"
                class="mb-4"
              ></v-text-field>
              
              <!-- Locale Values -->
              <div class="mb-4">
                <h4 class="text-subtitle-1 mb-2">Locale Values</h4>
                <div
                  v-for="locale in usedLocalesInVariable"
                  :key="locale"
                  class="d-flex align-center mb-2"
                >
                  <v-chip
                    size="small"
                    class="me-2"
                    style="min-width: 100px;"
                  >
                    {{ locale }}
                  </v-chip>
                  <v-text-field
                    v-model="localGlobals[selectedVariable][locale]"
                    variant="outlined"
                    density="compact"
                    class="me-2"
                    hide-details
                  ></v-text-field>
                  <v-btn
                    icon="mdi-close"
                    size="small"
                    variant="text"
                    @click="removeLocale(locale)"
                  ></v-btn>
                </div>
              </div>
              
              <!-- Add Locale -->
              <v-select
                v-if="availableLocales.length > 0"
                :items="availableLocales"
                :label="rendererLabels.addLocale"
                variant="outlined"
                density="compact"
                @update:model-value="addLocale"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <v-list-item-title>
                      {{ getLocaleDisplayName(item.value) }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-select>
            </div>
            
            <!-- Empty State -->
            <div v-else-if="!showAddVariable" class="pa-4 text-center">
              <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-variable</v-icon>
              <p class="text-grey">Select a variable to edit, or add a new one.</p>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog">{{ rendererLabels.cancel }}</v-btn>
        <v-btn @click="saveChanges" color="primary">{{ rendererLabels.save }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border-e {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>

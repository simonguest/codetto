<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { useTheme } from "vuetify";

import { settingsStore } from "@store/settingsStore";
import { pyodideStore } from "@store/pyodideStore";
import { jediStore } from "@store/jediStore";
import { THEME_LABELS, Locale, LOCALE_OPTIONS, LOCALE_METADATA, SETTINGS_LABELS } from "@/i18n";
import { Theme, THEME_OPTIONS } from "@/theme";

const showAddEnvVar = ref(false);
const newEnvVarName = ref('');
const newEnvVarValue = ref('');
const envVarNameError = ref('');
const envVarValueError = ref('');

const envVarEntries = computed(() => Object.keys(settingsStore.envVars));

function openAddEnvVar() {
  newEnvVarName.value = '';
  newEnvVarValue.value = '';
  envVarNameError.value = '';
  envVarValueError.value = '';
  showAddEnvVar.value = true;
}

function cancelAddEnvVar() {
  showAddEnvVar.value = false;
}

function confirmAddEnvVar() {
  const labels = settingsLabels.value;
  envVarNameError.value = newEnvVarName.value.trim() ? '' : labels.envVarNameRequired;
  envVarValueError.value = newEnvVarValue.value ? '' : labels.envVarValueRequired;
  if (envVarNameError.value || envVarValueError.value) return;
  settingsStore.setEnvVar(newEnvVarName.value.trim(), newEnvVarValue.value);
  showAddEnvVar.value = false;
}

function deleteEnvVar(name: string) {
  settingsStore.deleteEnvVar(name);
}

// Get theme instance at setup level
const theme = useTheme();

const currentTheme = ref(settingsStore.theme);
const currentLocale = ref(settingsStore.locale);

const themes = computed(() => THEME_OPTIONS.map(themeOption => ({
  title: THEME_LABELS[settingsStore.locale][themeOption],
  value: themeOption
})));

const locales = LOCALE_OPTIONS.map(localeOption => ({
  title: LOCALE_METADATA[localeOption].name,
  value: localeOption
}));

// Get settings labels based on current locale
const settingsLabels = computed(() => SETTINGS_LABELS[settingsStore.locale]);

// Initialize theme on component mount
onMounted(() => {
  theme.change(settingsStore.theme);
});

// Watch for theme changes and update Vuetify
watch(currentTheme, (newTheme) => {
  theme.change(newTheme);
});

const updateTheme = (newTheme: Theme) => {
  settingsStore.setTheme(newTheme);
  currentTheme.value = newTheme;
};

const updateLocale = (locale: Locale) => {
  settingsStore.setLocale(locale);
  currentLocale.value = locale;
};

const currentCodeCompletion = ref(settingsStore.codeCompletion);

const updateCodeCompletion = (enabled: boolean) => {
  settingsStore.setCodeCompletion(enabled);
  currentCodeCompletion.value = enabled;
  if (enabled && jediStore.status === "disabled") {
    jediStore.initialize();
  }
};
</script>

<template>
  <div class="settings-view">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4 settings-title">{{ settingsLabels.title }}</h1>
          
          <v-card class="mb-4">
            <v-card-title>{{ settingsLabels.appearance }}</v-card-title>
            <v-card-text>
              <v-select
                v-model="currentTheme"
                :items="themes"
                :label="settingsLabels.theme"
                item-title="title"
                item-value="value"
                @update:model-value="updateTheme"
              ></v-select>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>{{ settingsLabels.language }}</v-card-title>
            <v-card-text>
              <v-select
                v-model="currentLocale"
                :items="locales"
                :label="settingsLabels.language"
                item-title="title"
                item-value="value"
                @update:model-value="updateLocale"
              ></v-select>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>{{ settingsLabels.editor }}</v-card-title>
            <v-card-text>
              <v-switch
                v-model="currentCodeCompletion"
                :label="settingsLabels.codeCompletion"
                :hint="settingsLabels.codeCompletionHint"
                persistent-hint
                color="primary"
                @update:model-value="updateCodeCompletion"
              ></v-switch>
            </v-card-text>
          </v-card>

          <v-card class="mb-4">
            <v-card-title>{{ settingsLabels.environmentVariables }}</v-card-title>
            <v-card-text>
              <v-list v-if="envVarEntries.length > 0" density="compact" class="mb-2">
                <v-list-item
                  v-for="name in envVarEntries"
                  :key="name"
                  :title="name"
                  subtitle="••••••••"
                >
                  <template #append>
                    <v-btn
                      variant="text"
                      color="error"
                      size="small"
                      @click="deleteEnvVar(name)"
                    >{{ settingsLabels.envVarDelete }}</v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis mb-2">{{ settingsLabels.envVarEmpty }}</p>

              <div v-if="showAddEnvVar" class="d-flex align-start ga-2 mt-2">
                <v-text-field
                  v-model="newEnvVarName"
                  :label="settingsLabels.envVarName"
                  :error-messages="envVarNameError"
                  density="compact"
                  hide-details="auto"
                  class="flex-grow-0"
                  style="width: 180px"
                ></v-text-field>
                <v-text-field
                  v-model="newEnvVarValue"
                  :label="settingsLabels.envVarValue"
                  :error-messages="envVarValueError"
                  density="compact"
                  hide-details="auto"
                  class="flex-grow-1"
                ></v-text-field>
                <v-btn color="primary" variant="tonal" @click="confirmAddEnvVar">{{ settingsLabels.envVarAdd }}</v-btn>
                <v-btn variant="text" @click="cancelAddEnvVar">{{ settingsLabels.envVarCancel }}</v-btn>
              </div>
              <v-btn v-else color="primary" variant="tonal" size="small" @click="openAddEnvVar">
                {{ settingsLabels.envVarAdd }}
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>{{ settingsLabels.about }}</v-card-title>
            <v-card-text>
              <p class="text-body-1">
                {{ settingsLabels.appName }}
              </p>
              <p class="text-body-2 text-medium-emphasis">
                {{ settingsLabels.version }} 0.1.0
              </p>
              <p class="text-body-2 text-medium-emphasis">
                {{ settingsLabels.pyodideVersion }}: {{ pyodideStore.pyodideVersion ?? '...' }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.settings-view {
  height: 100%;
  width: 100%;
  padding: 16px;
}

/* RTL-aware title alignment */
html[dir="rtl"] .settings-title {
  text-align: right;
}

html[dir="ltr"] .settings-title {
  text-align: left;
}
</style>

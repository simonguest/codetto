<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { useTheme } from "vuetify";

import { settingsStore } from "@store/settingsStore";
import { THEME_LABELS, Locale, LOCALE_OPTIONS, LOCALE_METADATA, SETTINGS_LABELS } from "@/i18n";
import { Theme, THEME_OPTIONS } from "@/theme";

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
  theme.global.name.value = settingsStore.theme;
});

// Watch for theme changes and update Vuetify
watch(currentTheme, (newTheme) => {
  theme.global.name.value = newTheme;
});

const updateTheme = (newTheme: Theme) => {
  settingsStore.setTheme(newTheme);
  currentTheme.value = newTheme;
};

const updateLocale = (locale: Locale) => {
  settingsStore.setLocale(locale);
  currentLocale.value = locale;
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

          <v-card>
            <v-card-title>{{ settingsLabels.about }}</v-card-title>
            <v-card-text>
              <p class="text-body-1">
                {{ settingsLabels.appName }}
              </p>
              <p class="text-body-2 text-medium-emphasis">
                {{ settingsLabels.version }} 0.1.0
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

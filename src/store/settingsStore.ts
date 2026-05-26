import { reactive } from "vue";

import { Locale, DEFAULT_LOCALE} from "@/i18n";
import { Theme, DEFAULT_THEME } from "@/theme";

function loadEnvVars(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem('envVars') || '{}');
  } catch {
    return {};
  }
}

export const settingsStore = reactive({
  theme: (localStorage.getItem('theme') as Theme) || DEFAULT_THEME,
  locale: (localStorage.getItem('locale') as Locale) || DEFAULT_LOCALE,
  codeCompletion: localStorage.getItem('codeCompletion') !== 'false',
  envVars: loadEnvVars() as Record<string, string>,

  setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
  },

  setLocale(locale: Locale) {
    this.locale = locale;
    localStorage.setItem('locale', locale);
  },

  setCodeCompletion(enabled: boolean) {
    this.codeCompletion = enabled;
    localStorage.setItem('codeCompletion', String(enabled));
  },

  setEnvVar(name: string, value: string) {
    this.envVars[name] = value;
    localStorage.setItem('envVars', JSON.stringify(this.envVars));
  },

  deleteEnvVar(name: string) {
    delete this.envVars[name];
    localStorage.setItem('envVars', JSON.stringify(this.envVars));
  },
});

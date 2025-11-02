import { reactive } from "vue";

import { Locale, DEFAULT_LOCALE} from "@/i18n";
import { Theme, DEFAULT_THEME } from "@/theme"; 

export const settingsStore = reactive({
  theme: (localStorage.getItem('theme') as Theme) || DEFAULT_THEME,
  locale: (localStorage.getItem('locale') as Locale) || DEFAULT_LOCALE,
  
  setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
  },
  
  setLocale(locale: Locale) {
    this.locale = locale;
    localStorage.setItem('locale', locale);
  },
});

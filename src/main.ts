import { createApp } from "vue";

// Vuetify
import "vuetify/styles";

// KaTeX styles (for math rendering in markdown cells)
import "katex/dist/katex.min.css";

import { createVuetify } from "vuetify";
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Router
import router from "@/router";

// Components
import App from "@/App.vue";

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          background: '#eef0f8',
          surface: '#f8f9fc',
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#82B1FF',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
      dark: {
        colors: {
          background: '#12141c',
          surface: '#1d1f2e',
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },

  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  }
});

createApp(App).use(vuetify).use(router).mount("#app");

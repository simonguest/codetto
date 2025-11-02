<script setup lang="ts">
import BaseLayout from "./BaseLayout.vue";
</script>

<template>
  <BaseLayout />
</template>

<style>

@import "./styles.css";
@import "./icons.min.css";

/* Global RTL support styles */
html[dir="rtl"] {
  direction: rtl;
}

html[dir="ltr"] {
  direction: ltr;
}

/* RTL-specific adjustments for Vuetify components */
html[dir="rtl"] .v-card {
  text-align: right;
}

html[dir="rtl"] .v-card-title {
  text-align: right;
}

html[dir="rtl"] .v-card-text {
  text-align: right;
}

html[dir="rtl"] .v-select {
  text-align: right;
}

html[dir="rtl"] .v-field__input {
  text-align: right;
}

html[dir="rtl"] .v-list-item-title {
  text-align: right;
}

/* Ensure proper spacing and alignment for RTL */
html[dir="rtl"] .v-container {
  padding-right: 16px;
  padding-left: 16px;
}

/* RTL adjustments for bottom navigation */
html[dir="rtl"] .v-bottom-navigation .v-btn {
  flex-direction: column;
}

html[dir="rtl"] .v-bottom-navigation .v-btn .v-icon {
  margin-bottom: 4px;
}

/* Ensure text inputs work properly in RTL */
html[dir="rtl"] input,
html[dir="rtl"] textarea {
  text-align: right;
}

html[dir="ltr"] input,
html[dir="ltr"] textarea {
  text-align: left;
}

/* Smooth transitions for direction changes */
* {
  transition: text-align 0.3s ease, direction 0.3s ease;
}

</style>
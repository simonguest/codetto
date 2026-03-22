<script setup lang="ts">
import { computed } from "vue";

import { notebookStore } from "@store/notebookStore";

const jsonOutput = computed(() => {
  if (!notebookStore.content?.cells?.length) {
    return JSON.stringify({ message: "No notebook loaded" }, null, 2);
  }
  return JSON.stringify(notebookStore.content, null, 2);
});
</script>

<template>
  <div class="notebook-json">
    <pre>{{ jsonOutput }}</pre>
  </div>
</template>

<style scoped>
.notebook-json {
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 0;
  min-height: 100vh;
  box-sizing: border-box;
}

pre {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
  font-weight: 400;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .notebook-json {
    background-color: #1e1e1e;
    border-color: #404040;
  }

  pre {
    color: #e8e8e8;
  }
}

body {
  margin: 0;
  padding: 0;
}
</style>

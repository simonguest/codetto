<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";

import { getNotebook } from "@storage/notebookStorage";
import type { Notebook } from "@schemas/notebook";

const route = useRoute();

const notebookId = computed(() => route.params.id as string);
const notebook = ref<Notebook | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

// Set the content type for JSON response
onMounted(async () => {
  try {
    loading.value = true;
    error.value = null;
    notebook.value = await getNotebook(notebookId.value);
  } catch (err) {
    console.error("Failed to load notebook:", err);
    error.value = err instanceof Error ? err.message : "Failed to load notebook";
  } finally {
    loading.value = false;
  }
});

const jsonOutput = computed(() => {
  if (error.value) {
    return JSON.stringify(
      {
        error: error.value,
        message: "Notebook not found or could not be loaded"
      },
      null,
      2
    );
  }
  
  if (notebook.value) {
    return JSON.stringify(notebook.value, null, 2);
  }
  
  return JSON.stringify({ message: "Loading..." }, null, 2);
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

/* Light theme override for better readability */
body {
  margin: 0;
  padding: 0;
}
</style>

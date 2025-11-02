<script setup lang="ts">
defineProps<{
  stderr: string;
}>();
</script>

<template>
  <textarea class="output-console" readonly>{{ stderr }}</textarea>
</template>

<style scoped>
.output-console {
  font-family: "JetBrainsMono", monospace;
  font-size: 10pt;
  border: none;
  width: 100%;
  border-radius: 5px;
  padding: 10px;
  min-height: 60px;
  resize: vertical;
}
</style>

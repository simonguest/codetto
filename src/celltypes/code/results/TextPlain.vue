<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  value: any;
}>();

const consoleRef = ref<HTMLTextAreaElement | null>(null);

// Adjust height based on length of output
const adjustHeight = () => {
  if (!consoleRef.value) return;
  const lineCount = props.value ? props.value.split('\n').length : 1;
  const lineHeight = 1.2; // em
  const padding = 1.5; // padding for bottom of text area control
  const calculatedHeight = `${(lineCount * lineHeight) + padding}em`;
  consoleRef.value.style.height = calculatedHeight;
};
</script>

<template>
  <textarea ref="consoleRef" class="output-console" readonly>{{
    Array.isArray(value) ? value.join("") : value
  }}</textarea>
</template>

<style scoped>
.output-console {
  font-family: "JetBrainsMono", monospace;
  font-size: 14px;
  border: none;
  width: 100%;
  border-radius: 5px;
  padding: 10px;
  overflow-y: auto;
  resize: none;
  box-sizing: border-box;
  line-height: 1.2em;
  max-height: calc(10em + 20px);
  min-height: 0;
}
</style>

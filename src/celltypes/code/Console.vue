<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';

const props = defineProps<{
  stdout: string;
}>();

const consoleRef = ref<HTMLTextAreaElement | null>(null);

// Adjust height based on length of output
const adjustHeight = () => {
  if (!consoleRef.value) return;
  const lineCount = props.stdout ? props.stdout.split('\n').length : 1;
  const lineHeight = 1.2; // em
  const padding = 1.5; // padding for bottom of text area control
  const calculatedHeight = `${(lineCount * lineHeight) + padding}em`;
  consoleRef.value.style.height = calculatedHeight;
};

// Watch for changes in stdout
watch(() => props.stdout, () => {
  adjustHeight();
}, { immediate: true });

// Adjust height on mount
onMounted(() => {
  adjustHeight();
});
</script>

<template>
  <textarea ref="consoleRef" class="output-console" readonly>{{ stdout }}</textarea>
</template>

<style scoped>
.output-console {
  font-family: "JetBrainsMono", monospace;
  font-size: 10pt;
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

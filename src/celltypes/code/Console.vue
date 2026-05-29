<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps<{
  stdout: string;
}>();

const consoleRef = ref<HTMLTextAreaElement | null>(null);

const adjustHeight = () => {
  if (!consoleRef.value) return;
  consoleRef.value.style.height = 'auto';
  const maxPx = 10 * 1.2 * 16 + 20;
  consoleRef.value.style.height = Math.min(consoleRef.value.scrollHeight, maxPx) + 'px';
};

watch(() => props.stdout, () => {
  nextTick(adjustHeight);
}, { immediate: true });

onMounted(() => {
  // Vuetify's tab window slides in with a CSS transition, so scrollHeight reads
  // as 0 inside a plain nextTick. Two rAF passes let the transition settle first.
  requestAnimationFrame(() => requestAnimationFrame(adjustHeight));
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

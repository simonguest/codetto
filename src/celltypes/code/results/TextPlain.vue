<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";

const props = defineProps<{
  value: any;
}>();

const consoleRef = ref<HTMLTextAreaElement | null>(null);

// Adjust height based on actual rendered content, capped at 10 lines
const adjustHeight = () => {
  if (!consoleRef.value) return;
  consoleRef.value.style.height = 'auto';
  const maxPx = 10 * 1.2 * 16 + 20;
  consoleRef.value.style.height = Math.min(consoleRef.value.scrollHeight, maxPx) + 'px';
};

watch(() => props.value, () => {
  adjustHeight();
}, { immediate: true });

onMounted(async () => {
  await nextTick();
  adjustHeight();
});
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

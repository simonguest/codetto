<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps<{
  stdout: string;
}>();

const consoleRef = ref<HTMLTextAreaElement | null>(null);

const LINE_HEIGHT_PX = 16; // matches CSS line-height: 16px (≈ 10pt × 1.2)
// No top padding so scrollTop is always a multiple of LINE_HEIGHT_PX —
// prevents the top visible line from being cut when autoscrolling to the bottom.
const PADDING_BOTTOM_PX = 10;

const rowCount = computed(() => {
  if (!props.stdout) return 1;
  const lines = props.stdout.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return Math.max(1, Math.min(lines.length, 15));
});

const heightStyle = computed(() => ({
  height: `${rowCount.value * LINE_HEIGHT_PX + PADDING_BOTTOM_PX}px`,
}));

watch(() => props.stdout, async () => {
  await nextTick();
  if (consoleRef.value) {
    consoleRef.value.scrollTop = consoleRef.value.scrollHeight;
  }
});
</script>

<template>
  <textarea ref="consoleRef" :style="heightStyle" class="output-console" readonly>{{ stdout.replace(/\n$/, '') }}</textarea>
</template>

<style scoped>
.output-console {
  font-family: "JetBrainsMono", monospace;
  font-size: 10pt;
  border: none;
  width: 100%;
  border-radius: 5px;
  padding: 0 10px 10px;
  overflow-y: auto;
  resize: none;
  box-sizing: border-box;
  line-height: 16px;
}

.output-console:focus {
  outline: none;
}
</style>

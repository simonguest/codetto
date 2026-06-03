<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: any;
}>();

const LINE_HEIGHT_PX = 17; // ≈ 1.2em at 14px font size
const PADDING_BOTTOM_PX = 10;

const rowCount = computed(() => {
  const text = Array.isArray(props.value) ? props.value.join("") : String(props.value ?? "");
  if (!text) return 1;
  const lines = text.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return Math.max(1, Math.min(lines.length, 10));
});

const heightStyle = computed(() => ({
  height: `${rowCount.value * LINE_HEIGHT_PX + PADDING_BOTTOM_PX}px`,
}));
</script>

<template>
  <textarea :style="heightStyle" class="output-text" readonly>{{
    Array.isArray(value) ? value.join("") : value
  }}</textarea>
</template>

<style scoped>
.output-text {
  font-family: "JetBrainsMono", monospace;
  font-size: 14px;
  border: none;
  width: 100%;
  border-radius: 5px;
  padding: 0 10px 10px;
  overflow-y: auto;
  resize: none;
  box-sizing: border-box;
  line-height: 17px;
}

.output-text:focus {
  outline: none;
}
</style>

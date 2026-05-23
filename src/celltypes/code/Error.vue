<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { ansiToHtml } from './ansiToHtml';

const props = defineProps<{
  stderr: string;
}>();

const rendered = computed(() => ansiToHtml(props.stderr));

const errorRef = ref<HTMLPreElement | null>(null);

const adjustHeight = () => {
  if (!errorRef.value) return;
  errorRef.value.style.height = 'auto';
  const maxPx = 10 * 1.2 * 16 + 20;
  errorRef.value.style.height = Math.min(errorRef.value.scrollHeight, maxPx) + 'px';
};

watch(() => props.stderr, () => {
  nextTick(adjustHeight);
}, { immediate: true });

onMounted(async () => {
  await nextTick();
  adjustHeight();
});
</script>

<template>
  <pre ref="errorRef" class="output-error" v-html="rendered"></pre>
</template>

<style scoped>
.output-error {
  font-family: "JetBrainsMono", monospace;
  font-size: 10pt;
  border: none;
  width: 100%;
  border-radius: 5px;
  padding: 10px;
  overflow-y: auto;
  overflow-x: auto;
  resize: none;
  box-sizing: border-box;
  line-height: 1.2em;
  max-height: calc(10em + 20px);
  min-height: 0;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: red;
}
</style>

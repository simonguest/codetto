<script setup lang="ts">
import { computed } from 'vue';
import { ansiToHtml } from './ansiToHtml';

const props = defineProps<{
  stderr: string;
}>();

const rendered = computed(() => ansiToHtml(props.stderr));
</script>

<template>
  <pre class="output-error" v-html="rendered"></pre>
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
  max-height: calc(15 * 1.2em + 20px);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  color: red;
}
</style>

<script setup lang="ts">
defineProps<{
  value: any;
}>();
</script>

<template>
  <div class="html-output" v-html="value" />
</template>

<style scoped>
.html-output {
  font-size: 13px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
  padding: 6px 0;
}

.html-output :deep(table) {
  border-collapse: collapse;
  font-family: "JetBrainsMono", monospace;
  border: none;
  width: auto;
}

.html-output :deep(th),
.html-output :deep(td) {
  padding: 5px 14px;
  white-space: nowrap;
  border: 1px solid rgba(128, 128, 128, 0.2);
  text-align: right;
}

/* Column header row */
.html-output :deep(thead th) {
  background-color: rgba(33, 150, 243, 0.15);
  font-weight: 600;
  border-bottom: 2px solid rgba(33, 150, 243, 0.35);
}

/* Index column (th elements inside tbody) */
.html-output :deep(tbody th) {
  background-color: rgba(128, 128, 128, 0.08);
  color: rgba(128, 128, 128, 0.75);
  font-weight: normal;
  border-right: 2px solid rgba(128, 128, 128, 0.2);
}

/* Alternating row shading */
.html-output :deep(tbody tr:nth-child(even) td) {
  background-color: rgba(128, 128, 128, 0.04);
}

/* Row hover highlight */
.html-output :deep(tbody tr:hover td),
.html-output :deep(tbody tr:hover th) {
  background-color: rgba(33, 150, 243, 0.08);
}
</style>

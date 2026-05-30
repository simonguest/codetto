<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { viaGet } from "@/bridge/viaStore";

const props = defineProps<{
  value: string; // integer handle as a string
}>();

const containerRef = ref<HTMLDivElement | null>(null);

function mount() {
  const container = containerRef.value;
  if (!container) return;
  const handle = parseInt(props.value);
  const canvas = viaGet(handle);
  if (canvas && container.firstChild !== canvas) {
    container.innerHTML = "";
    container.appendChild(canvas);
  }
}

onMounted(mount);
watch(() => props.value, mount);
</script>

<template>
  <div ref="containerRef" class="canvas-output" />
</template>

<style scoped>
.canvas-output {
  padding: 6px 0;
}
.canvas-output :deep(canvas) {
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 4px;
}
</style>

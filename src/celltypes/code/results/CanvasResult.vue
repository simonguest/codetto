<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { viaGet } from "@/bridge/viaStore";

const props = defineProps<{
  value: string; // integer handle as a string
}>();

const outerRef = ref<HTMLDivElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isFullscreen = ref(false);

function mount() {
  const container = containerRef.value;
  if (!container) return;
  const handle = parseInt(props.value);
  const el = viaGet(handle);
  if (el && container.firstChild !== el) {
    container.innerHTML = "";
    container.appendChild(el);
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    outerRef.value?.requestFullscreen();
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
}

onMounted(() => {
  mount();
  document.addEventListener("fullscreenchange", onFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", onFullscreenChange);
});

watch(() => props.value, mount);
</script>

<template>
  <div ref="outerRef" class="s3d-container canvas-output">
    <div ref="containerRef" />
    <div class="s3d-overlay" :class="{ 's3d-overlay--visible': isFullscreen }">
      <v-btn
        icon
        size="small"
        variant="tonal"
        @click.stop="toggleFullscreen"
        :title="isFullscreen ? 'Exit full screen' : 'Full screen'"
      >
        <v-icon>{{ isFullscreen ? "mdi-fullscreen-exit" : "mdi-fullscreen" }}</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.s3d-container {
  position: relative;
  padding: 6px 0;
}
.s3d-container :deep(.canvas-layer-wrapper) {
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 4px;
  overflow: hidden;
}
.s3d-overlay {
  position: absolute;
  bottom: 14px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 10;
}
.s3d-container:hover .s3d-overlay,
.s3d-overlay--visible {
  opacity: 1;
}
</style>

<!-- Global: targets canvas-layer-wrapper (set by JS in provider.ts, not scoped) -->
<style>
.s3d-container:fullscreen {
  padding: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.s3d-container:fullscreen .canvas-layer-wrapper {
  width: 100vw !important;
  height: 100vh !important;
  aspect-ratio: unset !important;
  border: none !important;
  border-radius: 0 !important;
}
.s3d-container:fullscreen .canvas-layer-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>

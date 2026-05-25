<script setup lang="ts">
import { ref, computed } from 'vue';
import { RENDERER_LABELS, type Locale } from '@/i18n';

const props = defineProps<{
  value: any;
  locale: Locale | null;
}>();

const labels = computed(() => RENDERER_LABELS[props.locale || 'en-US']);
const dialog = ref(false);

function saveImage() {
  const blob = new Blob([props.value], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'image.svg';
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="image-container">
    <img :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`" @click="dialog = true" />
    <div class="image-overlay">
      <v-btn icon size="small" variant="tonal" @click.stop="dialog = true" title="View full size">
        <v-icon>mdi-magnify-plus-outline</v-icon>
      </v-btn>
    </div>
  </div>

  <v-dialog v-model="dialog" max-width="90vw">
    <v-card>
      <v-card-text class="pa-4">
        <img :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`" class="dialog-image" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="saveImage">{{ labels.save }}</v-btn>
        <v-btn @click="dialog = false">{{ labels.close }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.image-container {
  position: relative;
  display: inline-block;
}

.image-container img {
  cursor: pointer;
  display: block;
}

.image-overlay {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

.dialog-image {
  max-width: 100%;
  max-height: 80vh;
  display: block;
  margin: auto;
}
</style>

<script setup lang="ts">
interface Props {
  name: string;
  path: string;
}

interface Emits {
  (e: 'navigate', path: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
</script>

<template>
  <v-card
    class="folder-card"
    hover
    @click="emit('navigate', props.path)"
  >
    <v-card-text class="pb-2">
      <div class="spacer mb-2"></div>

      <div class="d-flex align-center">
        <v-icon
          icon="mdi-folder"
          size="large"
          color="primary"
          class="me-3"
        ></v-icon>
        <div class="flex-grow-1">
          <h3 class="text-h6 mb-1">{{ props.name }}</h3>
        </div>
        <v-icon icon="mdi-chevron-right" color="grey"></v-icon>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.folder-card {
  cursor: pointer;
  transition: transform 0.2s ease-in-out;
  height: 140px;
  display: flex;
  flex-direction: column;
}

.folder-card:hover {
  transform: translateY(-2px);
}

.folder-card .v-card-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: 12px;
}

.folder-card .text-h6 {
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.spacer {
  height: 28px;
}
</style>

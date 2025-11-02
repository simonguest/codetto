<script setup lang="ts">
import TextPlain from "./results/TextPlain.vue";
import ImagePng from "./results/ImagePng.vue";
import ImageSvg from "./results/ImageSvg.vue";

const props = defineProps<{
  value: any;
}>();

</script>

<template>
  <!-- {{ console.log(props.value)}} -->
  <ImageSvg v-if="value['image/svg+xml']" :value="value['image/svg+xml']" />
  <ImagePng v-if="value['image/png']" :value="value['image/png']" />
  <TextPlain v-if="value['text/plain']" :value="value['text/plain']" />
</template>
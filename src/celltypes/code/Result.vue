<script setup lang="ts">
import TextPlain from "./results/TextPlain.vue";
import TextHtml from "./results/TextHtml.vue";
import ImagePng from "./results/ImagePng.vue";
import ImageSvg from "./results/ImageSvg.vue";
import type { Locale } from "@/i18n";

const props = defineProps<{
  value: any;
  locale: Locale | null;
}>();

</script>

<template>
  <!-- {{ console.log(props.value)}} -->
  <ImageSvg v-if="value['image/svg+xml']" :value="value['image/svg+xml']" :locale="locale" />
  <ImagePng v-if="value['image/png']" :value="value['image/png']" :locale="locale" />
  <TextHtml v-else-if="value['text/html']" :value="value['text/html']" />
  <TextPlain v-else-if="value['text/plain']" :value="value['text/plain']" />
</template>
<script setup lang="ts">

defineProps<{
  value: any;
}>();

</script>

<template>
  <img :src="`data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`" />
</template>
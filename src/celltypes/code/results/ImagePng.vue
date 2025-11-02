<script setup lang="ts">

defineProps<{
  value: any;
}>();

</script>

<template>
  <img :src="`data:image/png;base64,${value}`" />
</template>
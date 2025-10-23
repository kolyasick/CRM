<script setup lang="ts">
type Props = {
  title: string;
  subtitle: string;
};
const props = defineProps<Props>();
</script>

<template>
  <div class="mb-6">
    <h1 class="text-2xl font-bold dark:text-white">{{ props.title }}</h1>
    <p class="text-gray-600 dark:text-gray-400">{{ props.subtitle }}</p>
  </div>
</template>

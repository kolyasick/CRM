<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps({
  error: Object as () => NuxtError,
});
</script>

<template>
  <div class="w-full h-screen flex flex-col gap-3 items-center justify-center bg-gray-100 dark:bg-gray-900">
    <h1 class="text-9xl text-gray-800 dark:text-white">{{ error?.statusCode }}</h1>
    <h3 class="text-4xl text-gray-800 dark:text-white break-all max-w-[1000px]">{{ error?.message }}</h3>
    <NuxtLink
      to="/"
      class="border border-gray-300 rounded-md p-2 text-gray-800 dark:text-white hover:bg-gray-800 hover:text-white"
      >Вернуться домой</NuxtLink
    >
  </div>
</template>

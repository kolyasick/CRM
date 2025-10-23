<script setup lang="ts">
const props = defineProps({
  count: {
    type: Number,
    default: 1,
  },
  height: {
    type: String,
    default: "h-5",
  },
  width: {
    type: String,
    default: "w-full",
  },
  rounded: {
    type: String,
    default: "rounded",
  },
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="i in props.count"
      :key="i"
      class="relative overflow-hidden bg-gray-200 dark:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
      :class="[height, width]"
    >
      <div
        class="absolute inset-0 -translate-x-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"
        style="animation: shimmer 1.5s infinite"
      ></div>
    </div>
  </div>
</template>

<style>
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>

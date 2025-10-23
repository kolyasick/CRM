<script setup lang="ts">
const props = defineProps<{ isOpen: boolean }>();

const emit = defineEmits<{ (e: "update:isOpen", value: boolean): void }>();
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 p-6 z-10 border-b border-gray-200 dark:border-gray-600">
        <h3 class="text-xl font-semibold dark:text-white">Добавление позиции</h3>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="emit('update:isOpen', false)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <slot />
    </div>
  </div>
</template>

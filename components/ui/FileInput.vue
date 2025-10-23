<script setup lang="ts">
type Props = {
  multiple?: boolean;
};

const props = defineProps<Props>();

const emits = defineEmits<{
  (e: "handleFileSelect", event: Event): void;
}>();
</script>

<template>
  <div class="flex items-center justify-center w-full">
    <label
      class="flex flex-col items-center justify-center w-full py-2 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
    >
      <div class="flex gap-2 items-center justify-center">
        <svg class="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            <span class="font-semibold">Нажмите для загрузки</span>
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Любые файлы до 10MB</p>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :multiple
        @dragover.prevent
        @drop.prevent="$emit('handleFileSelect', $event)"
        @change="$emit('handleFileSelect', $event)"
      />
    </label>
  </div>
</template>

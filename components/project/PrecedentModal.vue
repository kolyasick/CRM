<script setup lang="ts">
import type { IProject } from "~/types/project";

const props = defineProps<{
  modelValue: boolean;
  project: IProject | null;
  isLoading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", precedent: string): void;
}>();

const precedent = ref(props.project?.precedent || "");

const handleSave = () => {
  emit("save", precedent.value.trim());
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Прецедент менеджмент</h3>
        <button @click="$emit('update:modelValue', false)" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          <span class="sr-only">Закрыть</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <UiInput v-model="precedent" :rows="6" is-text-area placeholder="Введите описание прецедента..." title="Описание прецедента" />

      <div v-if="error" class="mb-4 text-sm text-red-600 dark:text-red-400">{{ error }}</div>

      <div class="flex justify-end space-x-3 mt-6">
        <button
          :disabled="isLoading"
          @click="$emit('update:modelValue', false)"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Отмена
        </button>
        <button
          @click="handleSave"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading">Сохранение...</span>
          <span v-else>Сохранить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IProject } from "~/types/project";

const { user } = useUserSession();
defineProps<{
  project: IProject;
}>();

const emit = defineEmits<{
  (e: "openAddPrecedentModal"): void;
  (e: "handleSave", text: string): void;
}>();
</script>
<template>
  <div
    class="bg-white dark:bg-gray-800 shadow p-6 lg:col-span-2"
    :class="{
      'border-2 border-red-200 dark:border-red-900': project?.precedent,
    }"
  >
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <div
          class="p-3 rounded-lg"
          :class="{
            'bg-red-100 dark:bg-red-900': project?.precedent,
            'bg-gray-100 dark:bg-gray-700': !project?.precedent,
          }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
            :class="{
              'text-red-600 dark:text-red-400': project?.precedent,
              'text-gray-400 dark:text-gray-500': !project?.precedent,
            }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-xl font-bold"
            :class="{
              'text-gray-900 dark:text-white': project?.precedent,
              'text-gray-500 dark:text-gray-400': !project?.precedent,
            }"
          >
            Прецедент
          </h2>
          <div class="flex items-center gap-2">
            <UiButton v-if="user && !project.isArchived && project.precedent" @click="emit('handleSave', '')" variant="danger">Удалить </UiButton>
            <UiButton v-if="user && !project.isArchived" @click="emit('openAddPrecedentModal')">Добавить </UiButton>
          </div>
        </div>
        <div v-if="project?.precedent" class="text-red-800 dark:text-red-600 break-all w-fit max-w-full bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
          {{ project.precedent }}
        </div>
        <div v-else>
          <p class="text-gray-500 dark:text-gray-400">Прецедентов нет</p>
        </div>
      </div>
    </div>
  </div>
</template>

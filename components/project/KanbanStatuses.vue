<script setup lang="ts">
import type { Project_status } from "@prisma/client";

defineProps<{
  status: Project_status;
}>();
</script>

<template>
  <h3
    class="font-semibold text-gray-600 dark:text-white mb-4 py-4 flex items-center gap-2 border-b-4 sticky top-0 z-10 bg-gray-100 dark:bg-gray-900"
    :class="{
      'border-blue-600': status.title === 'Новый',
      'border-yellow-600': status.title === 'На согласовании',
      'border-[#546a9d]': status.title === 'В работе',
      'border-red-600': status.title === 'Отмена',
      'border-orange-600': status.title === 'Правки',
      'border-emerald-600': status.title === 'Сдан',
      'border-purple-600': status.title === 'Проект завершен',
    }"
  >
    <span class="flex-shrink-0">
      <svg v-if="status.title === 'Новый'" class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      <svg v-else-if="status.title === 'На согласовании'" class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <svg v-else-if="status.title === 'В работе'" class="w-5 h-5 text-[#546a9d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <svg v-else-if="status.title === 'Отмена'" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <svg v-else-if="status.title === 'Правки'" class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
      <svg v-else-if="status.title === 'Сдан'" class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else-if="status.title === 'Проект завершен'" class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8"
        />
      </svg>
    </span>
    <span class="flex-grow 2xl:text-base text-sm">{{ status.title }}</span>
  </h3>
</template>

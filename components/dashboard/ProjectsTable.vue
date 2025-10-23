<script setup lang="ts">
import type { IProject } from "~/types/project";

const entityStore = useEntityStore();
const props = defineProps<{
  projects: IProject[];
}>();

const tableFields = ["Название", "Контрагент", "Статус", "Сумма", "Дата начала"];
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
    <div class="p-4 lg:p-6">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Последние проекты</h2>

      <SharedTable :fields="tableFields">
        <template #empty v-if="!projects || !projects.length">
          <div class="text-center py-6">
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-400">Нет проектов</h3>
            <p class="mt-1 text-sm text-gray-500">Создайте новый проект</p>
          </div>
        </template>
        <template #rows v-else>
          <tr v-for="project in projects" :key="project.id">
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white max-w-[250px]">
              <NuxtLink
                class="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                :to="`/project/${project.id}`"
                >{{ project.title }}</NuxtLink
              >
            </td>
            <td class="px-6 py-4 text-sm max-w-[300px]">
              <button
                @click="entityStore.openEntityModal(project.counterparty.id, 'counterparty')"
                class="font-semibold w-full truncate text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-start"
              >
                {{ project.counterparty?.title }}
              </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="useStatusClass(project.Project_status?.title)">
                {{ project.Project_status?.title }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatCurrency(Number(project.sum)) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(project.created_at) }}
            </td>
          </tr>
        </template>
      </SharedTable>
    </div>
  </div>
</template>

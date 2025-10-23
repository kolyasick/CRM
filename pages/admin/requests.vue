<script setup lang="ts">
import { IconsSearch } from "#components";
import type { IAction } from "~/types/project";

const store = useGeneralStore();

const limit = ref(20);
const offset = ref(0);
const hasMore = ref(true);
const showModerate = ref(false);
const searchQuery = useDebounceRef("", 300);

const actions = ref<IAction[]>([]);
const isLoading = ref(false);

const timeFilters = [
  { id: "all", label: "За все время", value: null },
  { id: "today", label: "Сегодня", value: "today" },
  { id: "yesterday", label: "Вчера", value: "yesterday" },
  { id: "week", label: "За неделю", value: "week" },
  { id: "month", label: "За месяц", value: "month" },
];

const selectedTimeFilter = ref("today");

const loadActions = async (isSearch: boolean = false) => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;

    if (isSearch) {
      offset.value = 0;
      actions.value = [];
      hasMore.value = true;
    }

    if (!hasMore.value && !isSearch) return;

    const data = await $fetch<IAction[]>("/api/admin/activity/findAll", {
      params: {
        limit: limit.value,
        offset: offset.value,
        username: searchQuery.value,
        type: showModerate.value ? "moderate" : undefined,
        period: selectedTimeFilter.value !== "all" ? timeFilters.find((f) => f.id === selectedTimeFilter.value)?.value : undefined,
      },
    });

    if (isSearch) {
      actions.value = data;
    } else {
      actions.value = [...actions.value, ...data];
    }

    if (!isSearch) {
      offset.value += data.length;
    }

    hasMore.value = data.length === limit.value;
  } catch (error) {
    console.error("Ошибка при загрузке заявок:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => await loadActions());

watch([searchQuery, selectedTimeFilter], async ([newQuery, newFilter], [oldQuery, oldFilter]) => {
  if (newQuery !== oldQuery || newFilter !== oldFilter) {
    await loadActions(true);
  }
});

watch(showModerate, async () => {
  await loadActions(true);
});

const loadMore = async () => {
  await loadActions(false);
};

const getActionRowClass = (action: any) => {
  if (action.statusCode >= 300) {
    return "bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500";
  }
  return "";
};

const getStatusCodeClass = (statusCode: number) => {
  if (statusCode >= 300) {
    return "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900";
};

const goToAction = async (link: string | null) => {
  if (!link) return;

  return navigateTo(link);
};

const tableFields = ["#", "Пользователь", "Описание", "Путь", "время"];
</script>

<template>
  <NuxtLayout name="admin-layout">
    <SharedPageTitle class="mb-6" title="Лог действий пользователей" subtitle="Отслеживание всех активностей пользователей на сайте" />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in timeFilters"
            :key="filter.id"
            @click="selectedTimeFilter = filter.id"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              selectedTimeFilter === filter.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
          >
            {{ filter.label }}
          </button>
        </div>

        <UiInput v-model="searchQuery" placeholder="Поиск по пользователю..." :icon="IconsSearch" variant="filled" />
      </div>
      <UiButton class="mt-5" @click="showModerate = !showModerate" :variant="!showModerate ? 'primary' : 'secondary'">
        <IconsClosedEye v-if="showModerate" class="w-4 h-4 transition-all duration-200" />
        <IconsEye v-else class="w-4 h-4 transition-all duration-200" />
        <span class="transition-all duration-200">
          {{ !showModerate ? "Показать согласования" : "Скрыть согласования" }}
        </span>
      </UiButton>
    </div>

    <SharedTable :fields="tableFields">
      <template v-if="!actions.length || isLoading" #empty>
        <div v-if="actions.length === 0 && !isLoading" class="text-center py-12">
          <div class="text-gray-400 dark:text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">Действия не найдены</p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Попробуйте изменить параметры фильтрации</p>
        </div>

        <div v-if="isLoading" class="text-center py-8">
          <div class="inline-flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span class="text-gray-600 dark:text-gray-400">Загрузка...</span>
          </div>
        </div>
      </template>
      <template #rows v-else>
        <tr
          v-for="action in actions"
          @click="goToAction(action.link)"
          :key="action.id"
          class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
          :class="[getActionRowClass(action), { 'cursor-pointer': action.link }]"
        >
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <span class="px-2 py-1 rounded text-xs font-medium capitalize" :class="getStatusCodeClass(action.statusCode)">
                {{ action.id }}
              </span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div v-if="action.user?.email !== 'admin@mail.ru'">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ action.user?.full_name }}
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ action.user?.email }}
              </div>
            </div>
            <div v-else class="text-sm font-medium text-gray-900 dark:text-white">MCRM</div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-start gap-2">
              <div class="flex-1">
                <div
                  class="text-sm font-medium flex flex-col gap-2"
                  :class="action.statusCode > 200 ? 'text-red-800 dark:text-red-200' : 'text-gray-900 dark:text-white'"
                >
                  <span>{{ action.description.split("\n").length && action.description.split("\n")[0] }}</span>
                  <span>{{ action.description.split("\n").length && action.description.split("\n")[1] }}</span>
                </div>
                <NuxtLink v-if="action.link" :to="action.link" class="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                  Перейти →
                </NuxtLink>
              </div>
              <div v-if="action.statusCode > 200" class="flex-shrink-0" title="Ошибка">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="text-sm text-gray-900 dark:text-white">{{ action.method }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{{ action.url }}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900 dark:text-white">
              {{ useRelativeTime(action.time) }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ new Date(action.time).toLocaleString() }}
            </div>
          </td>
        </tr>
      </template>
    </SharedTable>

    <div v-if="hasMore && actions.length && !isLoading" class="flex justify-center mt-6">
      <button
        @click="loadMore"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Загрузить еще
      </button>
    </div>
  </NuxtLayout>
</template>

<style scoped>
table {
  min-width: 800px;
}

/* Плавная анимация для табов */
button {
  transition: all 0.2s ease-in-out;
}

/* Стили для скролла */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark .overflow-x-auto::-webkit-scrollbar-track {
  background: #2d3748;
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>

<script setup lang="ts">
import type { IApplication } from "~/types/project";

const limit = ref(9);
const offset = ref(0);
const hasMore = ref(true);
const searchQuery = useDebounceRef("", 300);

const apps = ref<IApplication[]>([]);
const isLoading = ref(false);

const loadApps = async (isSearch: boolean = false) => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;

    if (isSearch) {
      offset.value = 0;
      apps.value = [];
      hasMore.value = true;
    }

    if (!hasMore.value && !isSearch) return;

    const data = await $fetch<IApplication[]>("/api/application", {
      params: {
        limit: limit.value,
        offset: offset.value,
        q: searchQuery.value,
      },
    });

    if (isSearch) {
      apps.value = data;
    } else {
      apps.value = [...apps.value, ...data];
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

await loadApps();

watch(searchQuery, async (newQuery, oldQuery) => {
  if (newQuery.trim() && newQuery !== oldQuery) {
    await loadApps(true);
  }
});

const loadMore = async () => {
  await loadApps(false);
};
const getAppColor = (app: IApplication) => {
  if (app.isPayed) {
    return "bg-gradient-to-r from-gray-600 to-gray-500";
  }

  if (app.isUrgent && app.payStatus?.title !== "Оплачен") {
    return "bg-gradient-to-r from-red-700 to-red-500";
  } else if ((!app.isUrgent && app.isIncome) || (app.isIncome && app.payStatus?.title === "Оплачен")) {
    return "bg-gradient-to-r from-green-700 to-cyan-500";
  } else if (app.isPayed) {
    return "bg-gray-100";
  } else {
    return "bg-gradient-to-r from-blue-700 to-blue-500";
  }
};
</script>

<template>
  <NuxtLayout name="admin-layout">
    <div>
      <SharedPageTitle title="Последние заявки" subtitle="Просмотр всех заявок" />

      <div class="max-w-[500px] w-full mb-5">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Поиск</label>
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Поиск по названию"
            class="w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 bg-gray-200 dark:text-white"
          />
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
      <div v-if="!apps.length && !searchQuery && !isLoading" class="text-center py-8">
        <p class="text-gray-500">Заявок нет</p>
      </div>
      <div v-if="!apps.length && searchQuery && !isLoading" class="text-center py-8">
        <p class="text-gray-500">По запросу '{{ searchQuery }}' ничего не найдено</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template v-for="a in apps" :key="a.id">
          <div class="p-6 rounded-xl bg-white dark:bg-gray-800 shadow transition overflow-hidden relative pb-10">
            <div :class="getAppColor(a)" class="w-full h-1 absolute top-0 left-0"></div>
            <div class="text-gray-800 font-bold text-xl dark:text-white border-b border-gray-200 dark:border-gray-600 mb-4 pb-1">
              {{ formatCurrency(a.sum) }}
            </div>
            <div class="flex justify-between items-start gap-4 mb-3">
              <h3 class="text-lg font-medium text-gray-800 dark:text-white transition w-full truncate">
                {{ a.title }}
              </h3>
              <div class="flex flex-col gap-2">
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium text-nowrap',
                    a.adminStatus?.title === 'Согласовано'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : a.adminStatus?.title === 'Не согласовано' || a.adminStatus?.title === 'Отклонено'
                      ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      : '',
                  ]"
                >
                  {{ a.adminStatus?.title }}
                </span>
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium text-nowrap',
                    a.payStatus?.title === 'Оплачен'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
                  ]"
                >
                  {{ a.payStatus?.title }}
                </span>
              </div>
            </div>
            <div v-if="a.document">
              <span class="text-gray-400 dark:text-gray-500 text-sm">Документ</span>
              <NuxtLink :to="'/uploads/' + a.document" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline w-full block truncate">
                {{ a.document?.split("_$_")[0] }}
              </NuxtLink>
            </div>
            <p class="absolute bottom-2 left-2 text-xs text-gray-400 dark:text-gray-500">{{ formatDate(new Date(a.accountDate)) }}</p>
            <div class="mt-4 flex justify-end absolute bottom-2 right-2">
              <NuxtLink :to="'/applications?id=' + a.id" class="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >Подробнее →</NuxtLink
              >
            </div>
          </div>
        </template>
      </div>

      <div v-if="isLoading" class="text-center py-4">
        <p class="text-gray-500">Загрузка...</p>
      </div>

      <div class="flex items-center justify-end mt-5">
        <button
          v-if="hasMore && apps.length"
          @click="loadMore"
          :disabled="isLoading"
          class="text-sm bg-blue-600 p-2 rounded-md text-white font-medium hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {{ isLoading ? "Загрузка..." : "Загрузить больше" }}
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>

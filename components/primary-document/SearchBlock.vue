<script setup lang="ts">
import { IconsSearch } from "#components";

type Props = {
  documentTypes: string[];
};

const props = defineProps<Props>();

const q = defineModel("searchQuery");
const type = defineModel("type");
const status = defineModel("status");
const date = defineModel("date");

const filters = ref({
  q: "",
  type: undefined,
  status: undefined,
  date: undefined,
});
const showFilters = ref(false);

const applyFilters = () => {
  q.value = filters.value.q;
  type.value = filters.value.type;
  status.value = filters.value.status;
  date.value = filters.value.date;
};

const activeFiltersCount = computed(() => {
  let count = 0;
  if (date.value) count++;
  if (type.value) count++;
  if (status.value) count++;
  return count;
});

const clearFilters = () => {
  q.value = "";
  date.value = undefined;
  type.value = undefined;
  status.value = undefined;

  filters.value = {
    q: "",
    type: undefined,
    status: undefined,
    date: undefined,
  };
};
</script>

<template>
  <div class="mb-6">
    <div class="mb-4">
      <UiInput
        class="w-full max-w-[400px]"
        title="Поиск"
        placeholder="Поиск по счету, проекту, контрагенту..."
        v-model="q"
        :icon="IconsSearch"
      />
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        @click="showFilters = !showFilters"
        class="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        :class="showFilters ? 'rounded-t-lg' : 'rounded-lg'"
      >
        <span class="font-medium text-gray-700 dark:text-gray-300">
          Фильтры
          <span class="text-sm text-gray-500 ml-2"> {{ activeFiltersCount }} активных </span>
        </span>
        <IconsChevron class="w-4 h-4 transition-transform text-gray-500" :class="{ 'rotate-180': showFilters }" />
      </button>

      <div v-if="showFilters" class="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <UiInput v-model="filters.date" type="date" title="Дата счета" />
          <UiDropdown v-model="filters.type" title="Тип документа">
            <option :value="undefined">Все типы</option>
            <option v-for="type in documentTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </UiDropdown>
          <UiDropdown v-model="filters.status" title="Статус">
            <option :value="undefined">Все статусы</option>
            <option v-for="status in ['Не предоставлен', 'Предоставлен']" :key="status" :value="status">
              {{ status }}
            </option>
          </UiDropdown>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <UiButton variant="outline" @click="clearFilters"> Сбросить </UiButton>
          <UiButton @click="applyFilters"> Применить </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

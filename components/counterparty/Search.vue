<script setup lang="ts">
import type { Counterparty } from "@prisma/client";
import type { CounterParty } from "~/types/project";

const searchQuery = useDebounceRef("", 300);
const searchResults = ref<Counterparty[]>([]);
const isSearching = ref(false);
const isDropdownOpen = ref(false);

const props = defineProps<{
  legalEntityId: number | null;
  title?: string;
}>();

const counterParty = defineModel<CounterParty | null>();

const error = ref(null);

const performSearch = async (query: string) => {
  if (!query) {
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    const data = await $fetch<Counterparty[]>("/api/counterparty/search", {
      query: { q: query },
    });

    const counterpartyMap = new Map<string, Counterparty>();

    data?.forEach((cp) => {
      const key = cp.title.toLowerCase().trim();

      if (counterpartyMap.has(key)) {
        const existingCp = counterpartyMap.get(key)!;
        if (cp.legalEntityId === props.legalEntityId) {
          counterpartyMap.set(key, cp);
        }
      } else {
        counterpartyMap.set(key, cp);
      }
    });

    searchResults.value = Array.from(counterpartyMap.values());
  } catch (err: any) {
    console.error("Error searching counterparties:", err);
    searchResults.value = [];
    error.value = err;
  } finally {
    isSearching.value = false;
  }
};

watch(searchQuery, (newQuery) => {
  performSearch(newQuery);
});

const handleCounterpartySelect = (counterparty: CounterParty) => {
  console.log(counterparty.legalEntityId);
  counterParty.value = counterparty;
  searchQuery.value = "";
  isDropdownOpen.value = false;
};
const clearCounterparty = () => {
  counterParty.value = null;
  searchQuery.value = "";
};
const goToAddCounterparty = async () => {
  const isCModalOpen = useCookie<boolean>("isCModalOpen");
  isCModalOpen.value = true;
  await navigateTo("/counterparties");
};
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >{{ title || "Контрагент" }}
      <span class="text-red-500 ml-1">*</span>
    </label>
    <div class="relative">
      <div v-if="counterParty" class="">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-white max-w-[230px] truncate">{{ counterParty.title }}</div>
            <div class="mt-1 flex flex-wrap gap-2">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                ИНН: {{ counterParty.inn }}
              </span>
            </div>
          </div>
          <button
            type="button"
            @click="clearCounterparty"
            class="absolute bottom-1 right-1 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div v-else>
        <input
          type="text"
          :disabled="!props.legalEntityId"
          v-model="searchQuery"
          placeholder="Поиск по названию или ИНН"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          @focus="isDropdownOpen = true"
        />
        <div
          v-if="searchQuery && isDropdownOpen"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div v-if="isSearching" class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
            <div class="flex items-center justify-center">
              <IconsLoader class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" />
              Поиск...
            </div>
          </div>
          <template v-else>
            <div
              v-for="counterparty in searchResults"
              :key="counterparty.id"
              @click="
                handleCounterpartySelect(counterparty);
                error = null;
              "
              class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white">{{ counterparty.title }}</div>
                  <div class="mt-1 flex flex-wrap gap-2">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      ИНН: {{ counterparty.inn }}
                    </span>
                  </div>
                </div>
                <div class="ml-4 flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            <div v-if="searchResults.length === 0 && !isSearching" class="px-4 py-2 grid gap-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              {{ title || "Контрагент" }} не найден
              <button
                @click="goToAddCounterparty"
                class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
              >
                Добавить
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
    <span class="text-red-500 text-sm" v-if="error">{{ error }}</span>
  </div>
</template>

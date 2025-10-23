<script setup lang="ts">
import type { IApplication } from "~/types/project";

const store = useGeneralStore();
const errors = reactive<Record<string, string | null>>({});
const props = defineProps<{
  projectId?: number;
}>();

const { addNotification } = useNotification();

const emit = defineEmits<{
  (e: "submit", application: IApplication): Promise<void>;
  (e: "updateApplications", application: IApplication): void;
  (e: "handleToggleModal", val: boolean): void;
}>();

const newApplication = ref({
  sum: 0,
  projectId: props.projectId || "",
});
const isLoading = ref(false);

const application = ref<IApplication | null>(null);
const searchQuery = useDebounceRef("", 300);
const searchResults = ref<IApplication[]>([]);
const isSearching = ref(false);
const isDropdownOpen = ref(false);

let searchTimeout: NodeJS.Timeout | null = null;

const error = ref(null);

const performSearch = async (query: string) => {
  if (!query) {
    searchResults.value = [];
    return;
  }

  try {
    isSearching.value = true;
    const data = await $fetch<IApplication[]>("/api/application/search", {
      query: { q: query },
    });

    searchResults.value = data;
  } catch (err: any) {
    console.error("Error searching apps:", err);
    searchResults.value = [];
    error.value = err;
  } finally {
    isSearching.value = false;
  }
};

watch(searchQuery, (newQuery) => {
  performSearch(newQuery);
});

const clearApplication = () => {
  application.value = null;
  searchQuery.value = "";
};

const handleApplicationSelect = (app: IApplication) => {
  application.value = app;

  searchQuery.value = "";
  isDropdownOpen.value = false;
};

const goToAddApplication = async () => {
  emit("handleToggleModal", false);
};

const handleSubmit = async () => {
  if (!application.value) {
    errors.application = "Выберите заявку!";
    return;
  } else if (!newApplication.value.sum) {
    errors.sum = "Укажите сумму";
    return;
  } else if (!newApplication.value.projectId) {
    errors.project = "Укажите проект";
    return;
  } else if (application.value && application.value.adminStatus?.title !== "Согласовано") {
    errors.application = "Данная заявка еще не согласована! Сначала необходимо её согласовать";
    return;
  }
  try {
    isLoading.value = true;
    const response = await $fetch<IApplication>(`/api/application`, {
      method: "POST",
      body: {
        ...application.value,
        parentId: application.value.id,
        newProjectId: newApplication.value.projectId,
        partSum: newApplication.value.sum,
        isAgreed: true,
        positions: [],
      },
    });
    emit("handleToggleModal", false);
    emit("updateApplications", response);
    addNotification("Заявка успешно добавлена", "success");
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const validateSum = () => {
  if (application.value && newApplication.value.sum > application.value.sum) {
    errors.sum = `Сумма не может превышать ${formatCurrency(application.value.sum)}`;
    newApplication.value.sum = application.value.sum;
  } else {
    errors.sum = null;
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
      <h3 class="text-gray-800 dark:text-white text-xl">Поиск по заявкам</h3>
      <form @submit.prevent="handleSubmit" class="mt-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">*Заявка</label>
          <div class="relative">
            <div v-if="application" class="">
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-white max-w-[230px] truncate">{{ application.title }}</div>
                  <div class="mt-1 flex flex-wrap gap-2">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Сумма: {{ formatCurrency(application.sum) }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  @click="clearApplication"
                  class="ml-4 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
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
                v-model="searchQuery"
                placeholder="Поиск по названию"
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
                    v-for="app in searchResults"
                    :key="app.id"
                    @click="
                      handleApplicationSelect(app);
                      error = null;
                    "
                    class="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="font-medium text-gray-900 dark:text-white">{{ app.title }}</div>
                        <div class="mt-1 flex flex-wrap gap-2">
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            Общая сумма: {{ formatCurrency(app.parentId ? app.partSum || 0 : app.sum) }}
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
                  <div
                    v-if="searchResults.length === 0 && !isSearching"
                    class="px-4 py-2 grid gap-2 text-sm text-gray-500 dark:text-gray-400 text-center"
                  >
                    Заявка не найдена
                    <button
                      @click="goToAddApplication"
                      class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <span class="text-red-500 text-sm" v-if="errors.application">{{ errors.application }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-5">
          <UiDropdown
            v-if="!projectId"
            v-model="newApplication.projectId"
            @change="newApplication.projectId ? (errors.project = null) : (errors.project = 'Выберите проект')"
            title="*Проект"
            :disabled="!application"
            :error="errors.project"
          >
            <option value="">Выберите проект</option>
            <option v-for="project in store.projects" :key="project.id" :value="project.id">
              {{ project.title }}
            </option>
          </UiDropdown>
          <UiInput type="number" v-model="newApplication.sum" title="*Сумма" @input="validateSum" :error="errors.sum" :disabled="!application" />
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            @click="emit('handleToggleModal', false)"
          >
            Отмена
          </button>

          <button
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors"
          >
            <IconsLoader class="w-6 h-6 animate-spin" v-if="isLoading" />
            <span v-else> Выбрать </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

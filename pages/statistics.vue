<script setup lang="ts">

const store = useGeneralStore();

const today = new Date();
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(today.getDate() - 30);

const manager = ref<number | null>(null);
const counterparty = useDebounceRef("", 300);
const legal = ref(null);

const dateRange = ref<Date[]>([thirtyDaysAgo, today]);
const dateFrom = computed(() => (Array.isArray(dateRange.value) && dateRange.value[0] ? dateRange.value[0].toISOString().slice(0, 10) : ""));
const dateTo = computed(() => (Array.isArray(dateRange.value) && dateRange.value[1] ? dateRange.value[1].toISOString().slice(0, 10) : ""));

const period = computed(() => ({
  dateFrom: dateFrom.value,
  dateTo: dateTo.value,
  managerId: manager.value || undefined,
  counterparty: counterparty.value || undefined,
  legal: legal.value || undefined,
}));

const { data: stats, refresh } = await useFetch("/api/statistics", {
  query: period,
  watch: [period],
});

const { data: managers } = await useFetch("/api/user", {
  query: {
    role: "MANAGER",
  },
});

type SortField = "title" | "sum" | "income" | "expense" | "profit" | "jobsCount" | "applicationsCount";
type SortDirection = "asc" | "desc";

const sortField = ref<SortField>("title");
const sortDirection = ref<SortDirection>("asc");

const sortedProjects = computed(() => {
  if (!stats.value?.projectsDetail) return [];

  return [...stats.value.projectsDetail].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortField.value) {
      case "title":
        valueA = (a.title as string)?.toLowerCase() || "";
        valueB = (b.title as string)?.toLowerCase() || "";
        break;
      case "sum":
      case "income":
      case "expense":
      case "profit":
        valueA = a[sortField.value] || 0;
        valueB = b[sortField.value] || 0;
        break;
      case "jobsCount":
      case "applicationsCount":
        valueA = a[sortField.value] || 0;
        valueB = b[sortField.value] || 0;
        break;
      default:
        return 0;
    }

    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortDirection.value === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else {
      return sortDirection.value === "asc" ? valueA - valueB : valueB - valueA;
    }
  });
});

const handleSort = (field: SortField) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
};

const getSortArrowClass = (field: SortField) => {
  if (sortField.value !== field) return "opacity-30";
  return sortDirection.value === "asc" ? "rotate-180" : "";
};

const selectedManagerName = computed(() => {
  if (!manager.value) return null;
  return managers.value?.find((m) => m.id === manager.value)?.full_name || null;
});

const selectedLegalTitle = computed(() => {
  if (!legal.value) return null;
  return store.entities?.find((e) => e.id === legal.value)?.title || null;
});

const clearFilter = (filterType: string) => {
  switch (filterType) {
    case "date":
      dateRange.value = [];
      break;
    case "counterparty":
      counterparty.value = "";
      break;
    case "legal":
      legal.value = null;
      break;
    case "manager":
      manager.value = null;
      break;
  }
};

const monthlyChartData = computed(() => {
  if (!stats.value || !stats.value.monthlyStats) return { labels: [], datasets: [] };
  const months = Object.keys(stats.value.monthlyStats).sort();
  return {
    labels: months.map((m) => {
      const [year, month] = m.split("-");
      return `${month}.${year}`;
    }),
    datasets: [
      {
        label: "Доходы",
        data: months.map((m) => stats.value?.monthlyStats[m].income ?? 0),
        backgroundColor: "rgba(16, 185, 129, 0.5)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        fill: false,
      },
      {
        label: "Расходы",
        data: months.map((m) => stats.value?.monthlyStats[m].expense ?? 0),
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 2,
        fill: false,
      },
      {
        label: "Прибыль",
        data: months.map((m) => stats.value?.monthlyStats[m].profit ?? 0),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        fill: false,
      },
    ],
  };
});

useHead({
  title: "MCRM | Статистика",
  meta: [{ name: "description", content: "MCRM | Подробная статистика всех проектов" }],
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 lg:p-8">
    <div class="mb-8">
      <SharedPageTitle title="Статистика" subtitle="Аналитика по проектам и финансам" />
    </div>

    <div class="mb-6">
      <h2 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Фильтры</h2>
      <div class="flex flex-col lg:flex-row gap-4 mb-6 items-end">
        <!-- <div>
          <label class="block text-sm text-gray-600 dark:text-gray-300 mb-1">Промежуток дат</label>
          <DatePicker v-model="dateRange" locale="ru" range format="dd.MM.yyyy" @cleared="dateRange = []" :clearable="true" />
        </div> -->

        <UiDropdown v-model="legal" title="Юр. лицо">
          <option :value="null">Выберите юридическое лицо</option>
          <option v-for="entity in store.entities" :key="entity.id" :value="entity.id">
            {{ entity.title }}
          </option>
        </UiDropdown>

        <UiInput class="w-full lg:w-64" title="Контрагент" v-model="counterparty" placeholder="Введите контрагента" />

        <UiDropdown class="w-full lg:w-64" v-model="manager" title="Менеджер">
          <option :value="null" selected>Все менеджеры</option>
          <option v-for="manager in managers" :key="manager.id" :value="manager.id">
            {{ manager.full_name }}
          </option>
        </UiDropdown>
      </div>
    </div>

    <div v-if="dateRange[0] || counterparty || manager || legal" class="mb-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-3">Активные фильтры:</h3>
      <div class="flex flex-wrap gap-2">
        <div
          v-if="dateRange[0] && dateRange[1]"
          class="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-md"
        >
          <span class="text-sm flex items-center gap-2">
            <IconsDate class="w-5 h-5" /> <strong>Период:</strong> {{ formatDate(dateRange[0]) }} - {{ formatDate(dateRange[1]) }}
          </span>
          <button @click="clearFilter('date')" class="text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 text-sm">
            <IconsClose class="w-5 h-5" />
          </button>
        </div>

        <div v-if="legal" class="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-2 rounded-md">
          <span class="text-sm flex items-center gap-2">
            <IconsTown class="w-5 h-5" />
            <strong>Юр. лицо:</strong> {{ selectedLegalTitle }}</span
          >
          <button @click="clearFilter('legal')" class="text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100 text-sm">
            <IconsClose class="w-5 h-5" />
          </button>
        </div>

        <div
          v-if="counterparty"
          class="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-2 rounded-md"
        >
          <span class="text-sm flex items-center gap-2">
            <IconsTown class="w-5 h-5" />
            <strong>Контрагент:</strong> {{ counterparty }}</span
          >
          <button
            @click="clearFilter('counterparty')"
            class="text-green-600 dark:text-green-300 hover:text-green-800 dark:hover:text-green-100 text-sm"
          >
            <IconsClose class="w-5 h-5" />
          </button>
        </div>

        <div
          v-if="manager && selectedManagerName"
          class="flex items-center gap-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-2 rounded-md"
        >
          <span class="text-sm">👤 Менеджер: {{ selectedManagerName }}</span>
          <button
            @click="clearFilter('manager')"
            class="text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100 text-sm"
          >
            <IconsClose class="w-5 h-5" />
          </button>
        </div>

        <button
          v-if="dateRange[0] || counterparty || manager"
          @click="
            () => {
              clearFilter('date');
              clearFilter('counterparty');
              clearFilter('manager');
              clearFilter('legal');
            }
          "
          class="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <span class="text-sm flex items-center gap-2"> <IconsTrash class="w-5 h-5" /> Сбросить все </span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Доходы" :value="formatCurrency(stats?.income ?? 0)" icon="currency" />
      <StatCard title="Расходы" :value="formatCurrency(stats?.expense ?? 0)" icon="currency" />
      <StatCard title="Прибыль" :value="formatCurrency(stats?.profit ?? 0)" icon="currency" />
      <StatCard title="Проектов" :value="stats?.projectsCount?.toString() ?? '0'" icon="active" />
    </div>

    <div class="overflow-x-auto mt-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('title')"
              >
                <div class="flex items-center gap-2">
                  <span>Проект</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('title')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('sum')"
              >
                <div class="flex items-center gap-2">
                  <span>Сумма проекта</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('sum')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('income')"
              >
                <div class="flex items-center gap-2">
                  <span>Доходы</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('income')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('expense')"
              >
                <div class="flex items-center gap-2">
                  <span>Расходы</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('expense')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('profit')"
              >
                <div class="flex items-center gap-2">
                  <span>Прибыль</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('profit')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('jobsCount')"
              >
                <div class="flex items-center gap-2">
                  <span>Работ</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('jobsCount')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
              <th
                class="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                @click="handleSort('applicationsCount')"
              >
                <div class="flex items-center gap-2">
                  <span>Заявок</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6 transition-transform text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                    :class="getSortArrowClass('applicationsCount')"
                    viewBox="0 0 24 24"
                  >
                    <path fill="currentColor" d="M12 14.708L6.692 9.4l.708-.708l4.6 4.6l4.6-4.6l.708.708z" />
                  </svg>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="(p, i) in sortedProjects" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
              <td class="px-6 py-4 whitespace-nowrap">
                <NuxtLink
                  :to="`/project/${p.id}`"
                  class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors flex items-center gap-2"
                >
                  {{ p.title }}
                </NuxtLink>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(p.sum) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">+{{ formatCurrency(p.income) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400">-{{ formatCurrency(p.expense) }}</td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-bold"
                :class="p.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ p.profit >= 0 ? "+" : "" }}{{ formatCurrency(p.profit) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-center">
                <span
                  class="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold"
                >
                  {{ p.jobsCount }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-center">
                <span
                  class="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold"
                >
                  {{ p.applicationsCount }}
                </span>
              </td>
            </tr>

            <tr v-if="sortedProjects.length === 0">
              <td colspan="7" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <p class="text-lg font-medium mb-2">Проекты не найдены</p>
                  <p class="text-sm">Попробуйте изменить параметры фильтрации</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- <div v-if="sortedProjects.length > 0" class="mt-6 flex items-center justify-between">
        <p class="text-sm text-gray-600 dark:text-gray-400">Показано {{ sortedProjects.length }} из {{ stats?.projectsCount || 0 }} проектов</p>

        <div class="flex items-center gap-2">
          <button class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50">
            ← Назад
          </button>

          <div class="flex items-center gap-1">
            <button class="w-8 h-8 rounded-md bg-blue-500 text-white text-sm">1</button>
            <button class="w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">2</button>
            <button class="w-8 h-8 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">3</button>
          </div>

          <button class="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Вперед →</button>
        </div>
      </div> -->
    </div>
  </div>
</template>

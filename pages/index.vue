<script setup lang="ts">
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const firstDay = `${year}-${month.toString().padStart(2, "0")}-01`;
const lastDay = `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

const { data: stats } = await useFetch<any>(`/api/statistics?dateFrom=${firstDay}&dateTo=${lastDay}`);
const activeProjectsCount = computed(() => {
  if (!stats.value || !stats.value.statusBreakdown) return "0";
  return stats.value.statusBreakdown["В работе"]?.toString() || "0";
});

const completedProjectsCount = computed(() => {
  if (!stats.value || !stats.value.statusBreakdown) return "0";
  return stats.value.statusBreakdown["Сдан"]?.toString() || "0";
});

const newProjectsCount = computed(() => {
  if (!stats.value || !stats.value.statusBreakdown) return "0";
  return stats.value.statusBreakdown["Новый"]?.toString() || "0";
});

const projectStatusData = computed(() => {
  if (!stats.value || !stats.value.statusBreakdown) return { labels: [], datasets: [] };
  const statusOrder = ["Новый", "На согласовании", "В работе", "Правки", "Сдан", "Отмена", "Проект завершен", "Без статуса"];
  const statusColors: Record<string, string> = {
    Новый: "rgb(59, 130, 246)",
    "На согласовании": "rgb(234, 179, 8)",
    "В работе": "rgb(84, 106, 157)",
    Правки: "rgb(249, 115, 22)",
    Сдан: "rgb(16, 185, 129)",
    Отмена: "rgb(239, 68, 68)",
    "Проект завершен": "rgb(168, 85, 247)",
    "Без статуса": "rgb(107, 114, 128)",
  };
  const labels = Object.keys(stats.value.statusBreakdown).sort((a, b) => statusOrder.indexOf(a) - statusOrder.indexOf(b));
  const data = labels.map((label) => stats.value.statusBreakdown[label]);
  return {
    labels,
    datasets: [
      {
        label: "Кол-во проектов",
        data,
        backgroundColor: labels.map((label) => statusColors[label] || "rgb(107, 114, 128)"),
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.5)",
        hoverOffset: 4,
        hoverBorderWidth: 2,
        hoverBorderColor: "rgba(255, 255, 255, 0.8)",
      },
    ],
  };
});

const projectTimelineData = computed(() => {
  if (!stats.value || !stats.value.monthlyStats) return { labels: [], datasets: [] };
  const data = stats.value.monthlyStats;
  const formattedLabels = Object.keys(data).map((monthYear) => {
    const [year, month] = monthYear.split("-");
    const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  });
  return {
    labels: formattedLabels,
    datasets: [
      {
        label: "Прибыль",
        data: Object.values(data).map((v: any) => v.profit),
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(59, 130, 246)",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };
});
const projectLength = ref(5);
const recentProjects = computed(() => {
  if (!stats.value || !stats.value.projectsDetail) return [];
  return [...stats.value.projectsDetail]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, projectLength.value);
});

useHead({
  title: "MCRM | Дашборд",
  meta: [{ name: "description", content: "MCRM | Обзор проектов" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <div class="mb-8">
      <SharedPageTitle title="Дашборд" subtitle="Обзор проектов" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard title="Прибыль за текущий месяц" :value="formatCurrency(stats?.profit ?? 0)" icon="currency" />
      <StatCard title="Активные проекты" :value="activeProjectsCount" icon="active" />
      <StatCard title="Завершенные проекты" :value="completedProjectsCount" icon="done" />
      <StatCard title="Новые проекты" :value="newProjectsCount" icon="new" />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      <ChartCard type="doughnut" title="Распределение проектов по статусам" :data="projectStatusData" />
      <ChartCard title="Прибыль по месяцам" :data="projectTimelineData" />
    </div>

    <DashboardProjectsTable :projects="recentProjects" />
    <button
      v-if="stats.projectsDetail.length > projectLength"
      @click="projectLength = stats.projectsDetail.length"
      class="mx-auto px-4 py-2 rounded-md font-medium text-blue-600 dark:text-blue-400 underline"
    >
      <span class="flex items-center justify-center space-x-1">
        <span>Показать все</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </button>
  </NuxtLayout>
</template>

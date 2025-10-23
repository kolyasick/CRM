<script setup>
import { Line, Bar, Pie } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    default: "line",
  },
});

const darkMode = useCookie("crm-darkMode");

const chartOptions = computed(() => {
  const textColor = darkMode.value ? "#E5E7EB" : "#374151";
  const gridColor = darkMode.value ? "rgba(229, 231, 235, 0.1)" : "rgba(229, 231, 235, 0.8)";

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      filler: {
        propagate: true,
      },
      legend: {
        position: "top",
        labels: {
          color: textColor,
          font: {
            family: "Inter, sans-serif",
            size: 12,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: darkMode.value ? "#1F2937" : "#FFFFFF",
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: darkMode.value ? "#4B5563" : "#E5E7EB",
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== undefined) {
              label += new Intl.NumberFormat("ru-RU").format(context.parsed.y);
            } else if (context.parsed !== undefined) {
              label += new Intl.NumberFormat("ru-RU").format(context.parsed);
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          padding: 10,
          precision: 0,
          callback: function (value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + "M";
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K";
            }
            return value;
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          padding: 10,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        fill: "start",
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
      },
      bar: {
        borderRadius: 15,
        borderSkipped: false,
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutCubic",
    },
  };

  if (props.type === "pie" || props.type === "doughnut") {
    return {
      ...baseOptions,
      cutout: props.type === "doughnut" ? "70%" : "0%",
      plugins: {
        ...baseOptions.plugins,
        legend: {
          ...baseOptions.plugins.legend,
          position: "right",
        },
      },
    };
  }

  return baseOptions;
});

const chartData = computed(() => {
  if (!props.data) return {};

  if (props.type === "pie" || props.type === "doughnut") {
    return {
      ...props.data,
      datasets: props.data.datasets.map((dataset) => ({
        ...dataset,
        borderWidth: 0,
        borderRadius: 4,
        spacing: 2,
        hoverOffset: 10,
      })),
    };
  }

  return {
    ...props.data,
    datasets: props.data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || "rgba(59, 130, 246, 0.7)",
      borderColor: dataset.borderColor || "rgba(59, 130, 246, 1)",
    })),
  };
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">{{ title }}</h3>
    <div class="h-64 lg:h-80 relative">
      <Line v-if="type === 'line'" :data="chartData" :options="chartOptions" class="chart-canvas" />
      <Bar v-else-if="type === 'bar'" :data="chartData" :options="chartOptions" class="chart-canvas" />
      <Pie v-else-if="type === 'pie' || type === 'doughnut'" :data="chartData" :options="chartOptions" class="chart-canvas" />

      <div
        v-if="!data || !data.labels || data.labels.length === 0"
        class="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500"
      >
        Нет данных для отображения
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-canvas {
  transition: opacity 0.3s ease;
}

.chart-canvas:hover {
  opacity: 0.9;
}

.dark .chart-canvas {
  filter: brightness(0.95);
}
</style>

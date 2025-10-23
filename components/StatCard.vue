<script setup lang="ts">
import CurrencyRuble from "./icons/CurrencyRuble.vue";
import Active from "./icons/Active.vue";
import Done from "./icons/Done.vue";
import Plus from "./icons/Plus.vue";
import type { Component } from "vue";

const props = defineProps<{
  title: string;
  value: string;
  trend?: number;
  icon: "currency" | "active" | "done" | "new" | Component;
}>();

const iconComponent = computed(() => {
  switch (props.icon) {
    case "currency":
      return CurrencyRuble;
    case "active":
      return Active;
    case "done":
      return Done;
    case "new":
      return Plus;
    default:
      return props.icon;
  }
});

const getIconBgColor = computed(() => {
  switch (props.icon) {
    case "currency":
      return "bg-blue-100 dark:bg-blue-900";
    case "active":
      return "bg-green-100 dark:bg-green-900";
    case "done":
      return "bg-purple-100 dark:bg-purple-900";
    case "new":
      return "bg-orange-100 dark:bg-orange-900";
    default:
      return "bg-gray-100 dark:bg-gray-900";
  }
});

const getIconTextColor = () => {
  switch (props.icon) {
    case "currency":
      return "text-blue-600 dark:text-blue-400";
    case "active":
      return "text-green-600 dark:text-green-400";
    case "done":
      return "text-purple-600 dark:text-purple-400";
    case "new":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 relative">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ title }}</p>
        <p class="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{{ value }}</p>
        <div v-if="trend !== undefined" class="flex items-center mt-2">
          <span :class="trend >= 0 ? 'text-green-500' : 'text-red-500'" class="text-sm font-medium">
            {{ trend >= 0 ? "+" : "" }}{{ trend }}%
          </span>
          <span class="text-sm text-gray-500 dark:text-gray-400 ml-2"
            >в сравнении с прошлым мес.</span
          >
        </div>
      </div>
      <div
        :class="getIconBgColor"
        class="p-3 rounded-full absolute top-1/2 -translate-y-1/2 right-6"
      >
        <component :is="iconComponent" :class="getIconTextColor() + ' w-6 h-6'" />
      </div>
    </div>
  </div>
</template>


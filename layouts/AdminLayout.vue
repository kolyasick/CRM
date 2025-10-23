<script setup lang="ts">
const routes = [
  {
    name: "Главная",
    to: "/admin",
  },
  {
    name: "Действия",
    to: "/admin/requests",
  },
  {
    name: "Пользователи",
    to: "/admin/users",
  },
];
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
    <header
      class="sticky top-0 z-20 h-16 flex items-center justify-between px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <nav class="flex items-center space-x-8">
        <NuxtLink
          v-for="route in routes"
          :key="route.to"
          :to="route.to"
          class="relative pb-1 font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          {{ route.name }}
        </NuxtLink>
      </nav>
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">A</div>
        <span class="text-xl font-bold text-gray-800 dark:text-white">АДМИН - ПАНЕЛЬ</span>
      </div>
    </header>

    <div class="flex-1 p-8 space-y-6">
      <slot />
    </div>
  </div>
</template>
<style scoped>
.router-link-active {
  @apply border-b-2 border-blue-600 text-gray-700 dark:text-gray-200;
}
</style>

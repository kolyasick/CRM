<script setup lang="ts">
import { routes } from "./routes";

const { user, clear } = useUserSession();
const { addNotification } = useNotification();
const { show } = useConfirmModal();

const route = useRoute();
const isMobileMenuOpen = ref(false);

const sidebarWidth = computed(() => {
  return route.path === "/projects" ? "w-16" : "w-64";
});

const shouldRenderMenuItem = (path: string) => {
  if (path !== "/statistics" && path !== "/admin") {
    return true;
  }

  if (path === "/admin") {
    return user?.value?.email === "admin@mail.ru";
  }

  if (path === "/statistics") {
    return user?.value?.role === "ADMIN";
  }

  return user?.value?.role === "ADMIN";
};

const userNameShort = computed(() => {
  const parts = user.value?.fullname?.split(" ") || [];
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : user.value?.fullname?.[0]?.toUpperCase() || "Г";
});

const fullnameShort = computed(() => {
  const parts = user.value?.fullname?.split(" ") || [];
  return parts.length > 1
    ? `${parts[0].charAt(0).toUpperCase()}${parts[0].slice(1).toLowerCase()} ${parts[1][0].toUpperCase()}.`
    : user.value?.fullname || "Гость";
});

const logout = async () => {
  show({
    message: "Вы точно хотите выйти из аккаунта?",
    onConfirm() {
      clear()
        .then(() => {
          navigateTo("/login");
        })
        .then(() => {
          addNotification("Вы вышли из системы", "error");
        });
    },
  });
};
</script>

<template>
  <aside>
    <div class="lg:hidden">
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
        <svg v-if="!isMobileMenuOpen" class="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6 text-gray-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-40 bg-black bg-opacity-50" @click="isMobileMenuOpen = false"></div>
      <aside
        v-if="isMobileMenuOpen"
        class="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out"
        :class="sidebarWidth"
      >
        <div class="p-6">
          <div class="flex items-center justify-between" :class="{ 'flex-col': route.path === '/projects' }">
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">MCRM</h1>
            <SharedThemeToggle />
          </div>
        </div>
        <nav class="mt-6">
          <ul>
            <li v-for="item in routes" :key="item.path">
              <NuxtLink
                v-if="shouldRenderMenuItem(item.path)"
                :to="item.path"
                class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                :class="{ 'bg-gray-100 dark:bg-gray-700 ml-12': route.fullPath === item.path }"
                @click="isMobileMenuOpen = false"
              >
                <component :is="item.icon" class="w-6 h-6" :class="{ 'mr-3': route.path !== '/projects' }" />
                <span v-if="route.path !== '/projects'">{{ item.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <div class="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center text-gray-700 dark:text-gray-300">
            {{ user?.fullname }}
          </div>
        </div>
      </aside>
    </div>

    <div
      class="hidden lg:block transition-all duration-300 fixed z-20 left-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-lg flex-col"
      :class="sidebarWidth"
    >
      <div :class="route.path === '/projects' ? 'p-3 py-8' : 'p-6 py-8'">
        <div class="flex items-center justify-between" :class="{ 'flex-col gap-2': route.path === '/projects' }">
          <NuxtLink to="/" class="font-bold text-gray-800 dark:text-white" :class="route.path === '/projects' ? 'text-lg' : 'text-2xl'"
            >MCRM</NuxtLink
          >
          <SharedThemeToggle />
        </div>
      </div>
      <nav :class="route.fullPath !== '/projects' ? 'mt-6' : ''">
        <ul>
          <li v-for="item in routes" :key="item.path">
            <NuxtLink
              v-if="shouldRenderMenuItem(item.path)"
              :to="item.path"
              :title="item.title"
              class="flex items-center py-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
              :class="[
                { 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white': route.fullPath === item.path },
                { 'pl-10': route.fullPath === item.path && route.path !== '/projects' },
                route.path === '/projects' ? 'justify-center px-3' : 'px-6',
              ]"
            >
              <component :is="item.icon" class="w-6 h-6" :class="{ 'mr-3': route.path !== '/projects' }" />
              <span v-if="route.path !== '/projects'">{{ item.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div
        :class="route.path === '/projects' ? 'p-3 py-8' : 'p-6'"
        class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 absolute bottom-0 w-full"
      >
        <div :class="{ 'flex-col gap-2': route.path === '/projects' }" class="flex items-center text-gray-700 dark:text-gray-300">
          <span
            :class="route.path === '/projects' ? 'w-10 h-10 text-sm' : 'w-10 h-10'"
            class="bg-blue-500 rounded-full flex shrink-0 items-center justify-center text-base font-semibold text-white"
            >{{ userNameShort }}</span
          >
          <div v-if="route.path !== '/projects'" class="ml-3">
            <p class="text-sm font-semibold">{{ fullnameShort }}</p>
            <p v-if="user?.email" class="text-xs text-gray-500 dark:text-gray-400">
              {{ user?.email }}
            </p>
            <div v-else class="text-xs text-gray-500 dark:text-gray-400">
              Не авторизован <NuxtLink class="font-semibold underline" to="/login">Войти</NuxtLink>
            </div>
          </div>
          <button
            v-if="user"
            @click="logout"
            class="self-center hover:translate-x-0.5 transition-transform"
            :class="{ 'ml-auto': route.path !== '/projects' }"
          >
            <IconsLogout class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

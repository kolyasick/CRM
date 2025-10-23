<script setup lang="ts">
const email = ref<string | null>(null);
const password = ref<string | null>(null);
const serverErrors = ref<string | null>(null);
const isLoading = ref(false);

const { fetch } = useUserSession();
const { addNotification } = useNotification();

const handleSubmit = async () => {
  if (!email.value || !password.value) return;

  isLoading.value = true;
  await $fetch("/api/auth/login", {
    method: "POST",
    body: {
      email: email.value,
      password: password.value,
    },
  })
    .then(async () => {
      await fetch();
      await navigateTo("/");
      addNotification("Вы успешно вошли в систему", "success");
    })
    .catch((error: any) => {
      serverErrors.value = error.data.message;
    })
    .finally(() => {
      isLoading.value = false;
    });
};
</script>

<template>
  <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
    <div class="rounded-md shadow-sm -space-y-px">
      <div>
        <label for="email" class="sr-only">Email</label>
        <input
          id="email"
          v-model="email"
          name="email"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Email"
        />
      </div>
      <div>
        <label for="password" class="sr-only">Пароль</label>
        <input
          id="password"
          v-model="password"
          name="password"
          type="password"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Пароль"
        />
      </div>
    </div>

    <!-- <div class="flex items-center justify-between">
      <div class="text-sm">
        <NuxtLink
          to="/forgot-password"
          class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          Забыли пароль?
        </NuxtLink>
      </div>
    </div> -->

    <div>
      <button
        type="submit"
        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
      >
        <IconsLoader v-if="isLoading" class="w-7 h-7 animate-spin" />
        <p v-else>Войти</p>
      </button>
    </div>

    <span v-if="serverErrors" class="text-red-500 text-sm">{{ serverErrors }}</span>

    <!-- <div class="text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Нет аккаунта?
        <NuxtLink
          to="/register"
          class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          Зарегистрироваться
        </NuxtLink>
      </p>
    </div> -->
  </form>
</template>

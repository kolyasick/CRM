<script setup>
const email = ref("");

const handleSubmit = async () => {
  try {
    console.log("Password reset attempt:", {
      email: email.value,
    });
    navigateTo("/login");
  } catch (error) {
    console.error("Password reset error:", error);
  }
};
</script>

<template>
  <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
    <div>
      <label for="email" class="sr-only">Email</label>
      <input
        id="email"
        v-model="email"
        name="email"
        type="email"
        required
        class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
        placeholder="Email"
      />
    </div>

    <div>
      <button
        type="submit"
        class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
      >
        Отправить инструкции
      </button>
    </div>

    <div class="text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Вспомнили пароль?
        <NuxtLink to="/login" class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"> Войти </NuxtLink>
      </p>
    </div>
  </form>
</template>

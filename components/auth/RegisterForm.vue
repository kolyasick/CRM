<template>
  <form class="mt-8 space-y-6" @submit.prevent="submit">
    <div class="rounded-md shadow-sm -space-y-px">
      <div>
        <label for="name" class="sr-only">ФИО</label>
        <input
          id="name"
          v-model="fullname"
          name="name"
          type="text"
          :class="errors.fullname ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="ФИО"
        />
      </div>
      <div>
        <label for="email" class="sr-only">Email</label>
        <input
          id="email"
          v-model="email"
          name="email"
          :class="errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
          :class="errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Пароль"
        />
      </div>
      <div>
        <label for="confirm-password" class="sr-only">Подтвердите пароль</label>
        <input
          id="confirm-password"
          v-model="passwordRepeat"
          name="confirm-password"
          type="password"
          :class="errors.passwordRepeat ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          class="appearance-none rounded-none relative block w-full px-3 py-2 border placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Подтвердите пароль"
        />
      </div>
    </div>

    <span v-if="isErrorsEsixt" class="text-red-500 text-sm">{{
      errors.email || errors.password || errors.passwordRepeat || errors.fullname || serverErrors
    }}</span>
    <div>
      <button
        type="submit"
        :disabled="isLoading"
        class="group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:bg-gray-400 disabled:pointer-events-none"
      >
        <IconsLoader v-if="isLoading" class="w-7 h-7 animate-spin" />
        <p v-else>Зарегистрироваться</p>
      </button>
    </div>

    <div class="text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Уже есть аккаунт?
        <NuxtLink
          to="/login"
          class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          Войти
        </NuxtLink>
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useField, useForm } from "vee-validate";

const validationSchema = toTypedSchema(registerSchema);
const { handleSubmit, errors } = useForm({
  validationSchema,
});
const serverErrors = ref<string | null>(null);
const isLoading = ref(false);

const { value: fullname } = useField<string>("fullname");
const { value: email } = useField<string>("email");
const { value: password } = useField<string>("password");
const { value: passwordRepeat } = useField<string>("passwordRepeat");

const isErrorsEsixt = computed(() => {
  return Object.keys(errors.value).length > 0 || serverErrors.value !== null;
});

const { user, fetch: refreshSession } = useUserSession();

const submit = handleSubmit(async (values) => {
  isLoading.value = true;
  await $fetch("/api/auth/register", {
    method: "POST",
    body: {
      ...values,
    },
  })
    .then(async () => {
      await refreshSession();
      await navigateTo("/");
    })
    .catch((error) => {
      serverErrors.value = error.data.message;
    })
    .finally(() => {
      isLoading.value = false;
    });
});
</script>

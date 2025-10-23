<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Восстановление пароля</h2>
      <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        Введите свой email, и мы отправим вам инструкции по восстановлению пароля
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <AuthForgotPasswordForm />
      </div>
    </div>
  </div>
</template>

<script setup>

</script>

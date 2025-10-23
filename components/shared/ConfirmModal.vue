<script setup lang="ts">
const { confirmData, isOpen } = useConfirmModal();
const isLoading = ref(false);

const { addNotification } = useNotification();

const handleConfirm = async () => {
  try {
    isLoading.value = true;
    await confirmData.value.onConfirm();
    isOpen.value = false;
  } catch (e) {
    addNotification("Ошибка: что-то пошло не так", "error");
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="isOpen = false"></div>
        <div
          class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
        >
          <div class="sm:flex sm:items-start">
            <div
              class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10"
            >
              <svg class="h-6 w-6 text-red-600 dark:text-red-200" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                {{ confirmData.title }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ confirmData.message }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
            <UiButton @click="handleConfirm" :loading="isLoading" variant="primary">
              <span>Подтвердить</span>
            </UiButton>
            <UiButton @click="isOpen = false" :disabled="isLoading" variant="danger">
              <span>Отмена</span>
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

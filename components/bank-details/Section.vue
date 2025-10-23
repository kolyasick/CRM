<script setup lang="ts">
import type { BankAccount } from "@prisma/client";
const props = defineProps<{
  bankAccount: Omit<BankAccount, "id"> | null;
}>();

const emit = defineEmits<{
  (e: "openBankModal"): void;
}>();
</script>

<template>
  <div class="col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">Банковские реквизиты</h3>
      <button
        type="button"
        @click="emit('openBankModal')"
        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <IconsPlus v-if="!bankAccount?.title" class="w-4 h-4 mr-2" />
        <IconsPencil v-else class="w-4 h-4 mr-2" />
        {{ bankAccount?.title ? "Изменить" : "Добавить" }} реквизиты
      </button>
    </div>
    <div v-if="bankAccount?.title" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 grid grid-cols-2 gap-4">
      <div class="grid grid-cols-1 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Название банка</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.title }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">БИК</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.bik || "-" }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Номер счета</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.accountNumber || "-" }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-4">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Город</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.city || "-" }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Адрес</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.address || "-" }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Кор. счет</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ bankAccount?.cAccount || "-" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Legal_entity, BankAccount } from "@prisma/client";

type ILegalEntity = Legal_entity & {
  bankAccount?: BankAccount | null;
};

const { user } = useUserSession();
const route = useRoute();
const props = defineProps<{
  entity: ILegalEntity;
}>();

defineEmits<{
  (e: "edit", entity: ILegalEntity): void;
  (e: "delete", entity: ILegalEntity): void;
}>();

const canManage = computed(() => {
  return route.path.includes("entities") && (user.value?.role === "LAWYER" || user.value?.role === "ADMIN");
});
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ entity.title }}</h3>
        </div>
        <div v-if="canManage" class="flex space-x-2">
          <button @click="$emit('edit', entity)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button @click="$emit('delete', entity)" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="p-6 space-y-3">
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">ИНН</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.inn }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">КПП</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.kpp }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">ОГРН</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.ogrn }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Форма</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.form }}</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Физический адрес</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.physicalAddress }}</p>
              </div>
            </div>
            <div v-if="!entity.isPhysicalAddressEq" class="flex items-center space-x-2">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Юридический адрес</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.legalAddress }}</p>
              </div>
            </div>
            <div v-if="!entity.isMailAddressEq" class="flex items-center space-x-2">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Почтовый адрес</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.mailAddress }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Телефон</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.phone }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="entity.bankAccount" class="space-y-2">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 h-full">
            <div class="flex items-center space-x-2 mb-3">
              <svg class="w-5 h-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Банковские реквизиты</p>
            </div>
            <div class="space-y-2">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Банк</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ entity.bankAccount.title }}</p>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">БИК</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white break-all">{{ entity.bankAccount.bik }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Счет</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white break-all">{{ entity.bankAccount.accountNumber }}</p>
                </div>
                <div class="col-span-2">
                  <p class="text-sm text-gray-500 dark:text-gray-400">Кор. счет</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white break-all">{{ entity.bankAccount.cAccount }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconsMoney, IconsUsers } from "#components";
import type { IApplication } from "~/types/project";

const { data } = await useFetch<IApplication[]>("/api/debt/findAll");
const entityStore = useEntityStore();

const summary = computed(() => {
  if (!data.value?.length) return null;

  return {
    totalAmount: data.value?.reduce((sum, item) => sum + (item?.sum || 0), 0),
    totalInvoices: data.value?.length,
    totalContractors: new Set(data.value?.map((c) => c.id)).size,
  };
});

const calculateOverdueDays = (accountDate: Date) => {
  const today = new Date();
  const invoiceDate = new Date(accountDate);
  const diffTime = today.getTime() - invoiceDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 7 ? diffDays - 7 : 0;
};

const sendReminder = (invoice: any) => {
  console.log("Отправка напоминания для:", invoice);
};

const tableFields = ["Контрагент", "Проект", "Назначение", "Сумма", "Статус", "Действия"];
const excelData = data.value?.map((item) => ({
  Контрагент: item.counterparty?.title,
  ИНН: item.counterparty?.inn,
  Телефон: item.counterparty?.phone || "-",
  Проект: item.project?.title,
  "Назначение платежа": item.title,
  Сумма: item.sum,
  "Юр. лицо": item.legalEntity?.title,
  "Дней просрочки": calculateOverdueDays(item.accountDate),
  Статус: calculateOverdueDays(item.accountDate) ? "Просрочено" : "Ожидает оплаты",
}));

const { isExportLoading, handleExport } = useExportToExcel(excelData!, "Дебиторская задолженность");

useHead({
  title: "MCRM | Дебиторская задолженность",
  meta: [{ name: "description", content: "MCRM | Список должников" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <SharedPageTitle title="Дебиторская задолженность" subtitle="Управление долгами" />

    <div v-if="summary" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard title="Общая задолженность" :value="formatCurrency(summary.totalAmount)" icon="currency" />
      <StatCard title="Контрагентов" :value="summary.totalContractors.toString()" :icon="IconsUsers" />
      <StatCard title="Неоплаченных счетов" :value="summary.totalInvoices.toString()" :icon="IconsMoney" />
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="max-w-xl w-full">
          <UiInput placeholder="Поиск по контрагенту или назначению..." />
        </div>
      </div>
    </div>

    <SharedTable :fields="tableFields">
      <template v-if="!data?.length" #empty>
        <div class="text-center py-12">
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Нет задолженностей</h3>
          <p class="mt-1 text-sm text-gray-500">Все счета оплачены вовремя.</p>
        </div>
      </template>
      <template #rows v-else>
        <tr v-for="(app, index) in data" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">{{ app.counterparty?.title }}</div>
              <div class="text-sm text-gray-500">
                <span class="text-xs font-semibold">ИНН: </span>
                {{ app.counterparty?.inn }}
              </div>
              <div v-if="app.counterparty?.phone" class="text-sm text-gray-500 flex items-center gap-1">
                <IconsPhone class="w-4 h-4" />
                {{ app.counterparty?.phone }}
              </div>
              <div v-if="app.counterparty?.email" class="text-sm text-gray-500 flex items-center gap-1">
                <IconsMail class="w-4 h-4" />
                {{ app.counterparty?.email }}
              </div>
              <button @click="entityStore.openEntityModal(app.counterpartyId, 'counterparty')" class="text-blue-500 underline text-sm">
                Подробнее
              </button>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <NuxtLink
              :to="'/project/' + app.project?.id"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              <span class="max-w-[120px] truncate">{{ app.project?.title }}</span>
            </NuxtLink>
          </td>
          <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
            <span class="max-w-xs truncate">{{ app.title }}</span>
            <NuxtLink :to="'/applications?id=' + app.id" class="text-blue-500 underline text-sm block">Перейти</NuxtLink>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
            {{ formatCurrency(app.sum) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-yellow-100 text-yellow-800': calculateOverdueDays(app.accountDate) === 0,
                'bg-red-100 text-red-800': calculateOverdueDays(app.accountDate) > 0,
              }"
            >
              <IconsExclamanation v-if="calculateOverdueDays(app.accountDate) > 0" class="w-3 h-3 mr-1" />
              <IconsTime v-else class="w-3 h-3 mr-1" />
              {{ calculateOverdueDays(app.accountDate) > 0 ? `Просрочено ${calculateOverdueDays(app.accountDate)} дн.` : "Ожидает оплаты" }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button
              @click="sendReminder(app)"
              class="text-blue-600 dark:text-blue-500 hover:text-blue-900 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <IconsMail class="w-4 h-4" />
              Напомнить
            </button>
          </td>
        </tr>
      </template>
    </SharedTable>
    <div v-if="data?.length" class="flex justify-end mt-4">
      <UiButton @click="handleExport" variant="success" :loading="isExportLoading">
        <IconsDownload class="w-5 aspect-square" />
        Выгрузить в Excel
      </UiButton>
    </div>

    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Распределение по контрагентам</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <p class="mt-2">График будет отображен здесь</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Динамика задолженности</h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <p class="mt-2">График будет отображен здесь</p>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

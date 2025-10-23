<script setup lang="ts">
import type { PrimaryDocument } from "@prisma/client";
import type { IApplication, IPrimaryDocument } from "~/types/project";

const store = useGeneralStore();
const { addNotification } = useNotification();
const { user } = useUserSession();
const isAddLoading = ref(false);
const editingDoc = ref<IPrimaryDocument | null>(null);
const documentTypes = ref(["Акт", "Счет", "Договор"]);
const allDocuments = ref<IPrimaryDocument[]>([]);
const hasMore = ref(true);
const isModalOpen = ref(false);
const pending = ref(false);

const searchQueries = ref({
  q: useDebounceRef("", 300),
  type: undefined,
  status: undefined,
  date: undefined,
  limit: 10,
  offset: 0,
});

const getDocuments = async (isSearch: boolean = false) => {
  try {
    if (isSearch) searchQueries.value.offset = 0;

    pending.value = true;
    const data = await $fetch<IPrimaryDocument[]>("/api/primary-document/findAll", {
      query: searchQueries.value,
    });

    if (isSearch) {
      allDocuments.value = data;
    } else {
      allDocuments.value = [...allDocuments.value, ...data];
      searchQueries.value.offset += searchQueries.value.limit;
    }

    hasMore.value = data.length === searchQueries.value.limit;
  } catch (error) {
    console.log(error);
  } finally {
    pending.value = false;
  }
};
await getDocuments();

watch([() => searchQueries.value.q, () => searchQueries.value.type, () => searchQueries.value.status, () => searchQueries.value.date], async () => {
  await getDocuments(true);
});
const handleToggleModal = (val: boolean, doc?: IPrimaryDocument) => {
  if (doc) editingDoc.value = doc;
  if (val === false) editingDoc.value = null;

  isModalOpen.value = val;
  store.switchBody(val);
};

const handleSaveDocument = async (document: Omit<PrimaryDocument, "id"> | PrimaryDocument) => {
  try {
    isAddLoading.value = true;
    if ("id" in document && document.id) {
      const res = await $fetch<IPrimaryDocument>(`/api/primary-document/${document.id}/edit`, {
        method: "PUT",
        body: {
          ...document,
        },
      });

      if (res) {
        const index = allDocuments.value.findIndex((d) => d.id === document.id);
        if (index !== -1) {
          allDocuments.value[index] = res;
          addNotification("Документ успешно изменен", "success");
        }
      }
    } else {
      const res = await $fetch<IPrimaryDocument>("/api/primary-document/create", {
        method: "POST",
        body: {
          ...document,
        },
      });
      if (res) {
        allDocuments.value.unshift(res);
        addNotification("Документ успешно добавлен", "success");
      }
    }
  } catch (error) {
    console.log(error);
  } finally {
    isAddLoading.value = false;
    handleToggleModal(false);
  }
};

const updateDocuments = async () => {
  try {
    const apps = await $fetch<IApplication[]>("/api/application");
    apps.forEach(async (app: IApplication) => {
      let body: Omit<PrimaryDocument, "id" | "isEmailed" | "createdAt"> = {
        amount: app.sum,
        applicationId: app.id,
        counterpartyId: app.counterpartyId,
        documentLink: app.document,
        invoiceDate: app.accountDate,
        invoiceNumber: app.accountNumber!,
        type: app.title.toLowerCase().includes("договор") ? "Договор" : "Счет",
        legalEntityId: app.legalEntityId,
        managerId: app.project?.managerId!,
        paymentDate: null,
        projectId: app.project?.id!,
        provisionDeadline: null,
        status: app.actDocument ? "Предоставлен" : "Не предоставлен",
      };
      await $fetch("/api/primary-document/create", {
        method: "POST",
        body: {
          ...body,
        },
      });
    });
  } catch (error) {
    console.log(error);
  }
};

const tableFields = ["Дата и N счета", "Юр. лицо", "Контрагент", "Дата оплаты", "Проект", "Срок предоставления", "Документ", "Статус", ""];

const loadMore = async () => {
  if (!hasMore.value || pending.value) return;

  searchQueries.value.offset += searchQueries.value.limit;
  await getDocuments();
};

const excelData = allDocuments.value.map((doc) => ({
  "Дата и № счета": `${doc.invoiceDate ? new Date(doc.invoiceDate).toLocaleDateString("ru-RU") : ""} ${doc.invoiceNumber || ""}`,
  "Тип документа": doc.type,
  "Наша Фирма": doc.legalEntity?.title || "-",
  Контрагент: doc.counterParty?.title || "-",
  "Дата оплаты": doc.paymentDate ? new Date(doc.paymentDate).toLocaleDateString("ru-RU") : "Не оплачен",
  Проект: doc.project?.title || "-",
  "Срок предоставления": doc.provisionDeadline ? new Date(doc.provisionDeadline).toLocaleDateString("ru-RU") : "-",
  Сумма: doc.amount,
  Документ: doc.documentLink || "-",
  Статус: doc.status,
  Менеджер: doc.manager?.full_name || "-",
}));
const { isExportLoading, handleExport } = useExportToExcel(excelData, "Реестр первичных документов");

useHead({
  title: "MCRM | Реестр первичных документов",
  meta: [{ name: "description", content: "MCRM | Управление первичными документами" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <div class="flex items-center justify-between">
      <SharedPageTitle title="Реестр первичных документов" subtitle="Список первичных документов" />
      <div class="flex justify-between gap-2 items-center">
        <UiButton @click="handleToggleModal(true)">
          <IconsPlus class="w-4 aspect-square" />
          Добавить
        </UiButton>
        <UiButton v-if="user?.email === 'admin@mail.ru'" variant="secondary" @click="updateDocuments">
          <IconsPlus class="w-4 aspect-square" />
          Загрузить новые
        </UiButton>
      </div>
    </div>

    <PrimaryDocumentSearchBlock
      v-model:search-query="searchQueries.q"
      v-model:type="searchQueries.type"
      v-model:status="searchQueries.status"
      v-model:date="searchQueries.date"
      :document-types="documentTypes"
    />

    <SharedTable :fields="tableFields">
      <template v-if="!allDocuments?.length" #empty>
        <div class="text-center py-12">
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-400">Нет документов</h3>
          <p class="mt-1 text-sm text-gray-500">Добавьте первичные документы</p>
        </div>
      </template>
      <template #rows>
        <PrimaryDocumentItem v-for="document in allDocuments" :key="document.id" :document @handle-edit="handleToggleModal" />
      </template>
    </SharedTable>

    <div class="flex justify-start gap-2 mt-4">
      <UiButton v-if="allDocuments.length" variant="success" @click="handleExport" :loading="isExportLoading" :disabled="isExportLoading">
        <IconsDownload class="w-5 aspect-square" />
        Выгрузить в Excel
      </UiButton>
      <UiButton v-if="hasMore" @click="loadMore" :disabled="!hasMore || pending" :loading="pending" class="min-w-[150px]">
        <template v-if="hasMore"> Загрузить еще </template>
      </UiButton>
    </div>

    <transition name="fade">
      <LazyPrimaryDocumentModal
        v-if="isModalOpen"
        @toggle-modal="handleToggleModal"
        @handle-save="handleSaveDocument"
        :is-loading="isAddLoading"
        :document="editingDoc || undefined"
        :document-types="documentTypes"
      />
    </transition>
  </NuxtLayout>
</template>

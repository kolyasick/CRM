<script setup lang="ts">
import { IconsSearch, UiDropdown } from "#components";
import type { Pay_status } from "@prisma/client";
import type { IApplication } from "~/types/project";

const isModalOpen = ref(false);
const isIncome = ref(false);
const isLoading = ref(false);
const isAppsLoading = ref(false);
const isDropdownOpen = ref(false);
const isSearchModalOpen = ref(false);
const hideCompleted = ref(true);

const limit = ref(4);
const offset = ref(0);
const hasMore = ref(true);
const anchor = ref<HTMLDivElement>();

const { data: payStatuses } = await useFetch<Pay_status[]>("/api/pay-status");

const searchQuery = useDebounceRef("", 300);
const statuses = ref(["Согласовано", "Не согласовано", "Отклонено"]);
const statusFilter = ref("");
const legalEntityFilter = ref("");
const payStatusFilter = ref("");
const applications = ref<IApplication[]>([]);

const { addNotification } = useNotification();
const { show } = useConfirmModal();
const { user } = useUserSession();
const store = useGeneralStore();
const route = useRoute();

const handleToggleModal = (val: boolean) => {
  isModalOpen.value = val;
  store.switchBody(val);
};

const handleToggleSearchModal = (val: boolean) => {
  isSearchModalOpen.value = val;
  store.switchBody(val);
};

const getApplications = async (reset: boolean = false) => {
  console.log(isAppsLoading.value);
  if (isAppsLoading.value) return;

  try {
    isAppsLoading.value = true;

    if (reset) {
      offset.value = 0;
      applications.value = [];
      hasMore.value = true;
    }

    if (!hasMore.value && !reset) return;

    const res = await $fetch<IApplication[]>("/api/application", {
      query: {
        isCompleted: hideCompleted.value ? 0 : 1,
        id: route.query.id,
        limit: limit.value,
        offset: offset.value,
        q: searchQuery.value || undefined,
        legalEntityId: legalEntityFilter.value || undefined,
        payStatusId: payStatusFilter.value || undefined,
        adminStatus: statusFilter.value || undefined,
      },
    });

    if (reset) {
      applications.value = res;
    } else {
      applications.value = [...applications.value, ...res];
    }

    offset.value += res.length;
    hasMore.value = res.length === limit.value;
  } catch (error) {
    console.log(error);
  } finally {
    isAppsLoading.value = false;
  }
};

await getApplications(false);

watch([hideCompleted, () => route.query.id, searchQuery, statusFilter, payStatusFilter, legalEntityFilter], async () => {
  await getApplications(true);
});

let observer: IntersectionObserver | null = null;
onMounted(async () => {
  if (anchor.value) {
    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          if (!hasMore.value) return;
          console.log("intersecting");
          getApplications(false);
        }
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      }
    );

    observer.observe(anchor.value);
  }
});

const handleSaveApplication = async (applicationData: IApplication) => {
  try {
    isLoading.value = true;

    const application = await store.saveApplication(applicationData);
    if (!application) return;

    if ("id" in applicationData) {
      const applicationIndex = applications.value?.findIndex((a) => a.id === applicationData.id);
      if (applicationIndex !== undefined && applicationIndex !== -1) {
        applications.value![applicationIndex] = application;
      }
      addNotification(`Заявка обновлена`, "success");
    } else {
      applications.value?.unshift(application);
      handleToggleModal(false);
      addNotification(`Заявка добавлена`, "success");
    }
  } catch (error: any) {
    console.error("Error creating application:", error);
    addNotification("Ошибка: " + error, "error");
  } finally {
    isLoading.value = false;
  }
};

const handleAdminChange = async (app: IApplication, status: string, manager: string = "Не указан") => {
  show({
    message: `Вы уверены, что хотите изменить статус на "${status}"`,
    async onConfirm() {
      try {
        const application = await store.adminStatusChange(app, status, manager);

        const oldApplication = applications.value?.find((a) => a.id === app.id);
        if (application && oldApplication) {
          oldApplication.adminStatus = application.adminStatus;
          addNotification("Статус заявки изменён", "info");
        }

        handleToggleModal(false);
      } catch (error) {
        console.error("Error approving application:", error);
        addNotification("Произошла ошибка при изменении статуса", "error");
      }
    },
  });
};

watch(
  () => route.query.id,
  () => {
    useSeoMeta({
      title: "MCRM | " + (route.query.id ? "Заявка №" + route.query.id : "Заявки"),
      description: "MCRM | " + (route.query.id ? "Просмотр заявки №" + route.query.id : "Заявки"),
    });
  },
  {
    immediate: true,
  }
);

const updateApplications = (app: IApplication) => {
  applications.value?.unshift(app);
};
</script>

<template>
  <NuxtLayout name="page-layout">
    <div class="flex justify-between items-center gap-4 flex-wrap mb-6">
      <SharedPageTitle title="Заявки" subtitle="Управление заявками" />

      <div v-if="user" class="flex items-start flex-wrap gap-2">
        <div class="relative inline-block">
          <button
            @click="isDropdownOpen = !isDropdownOpen"
            class="bg-gradient-to-r text-sm from-blue-700 to-blue-500 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <IconsPlus class="h-4 w-4" />
            Заявка на оплату
            <IconsChevron class="h-4 w-4 ml-1 transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>

          <Transition name="fade">
            <div
              v-if="isDropdownOpen"
              @click.away="isDropdownOpen = false"
              class="absolute z-10 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-gradient-to-b from-blue-600 to-blue-500 ring-1 ring-black ring-opacity-5 focus:outline-none"
            >
              <div class="py-1">
                <button
                  @click="
                    handleToggleModal(true);
                    isIncome = false;
                  "
                  class="block w-full px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors duration-150 text-start"
                >
                  Создать новую
                </button>
                <button
                  @click="handleToggleSearchModal(true)"
                  class="block w-full px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors duration-150 text-start"
                >
                  Выбрать существующую
                </button>
              </div>
            </div>
          </Transition>
        </div>
        <button
          class="bg-gradient-to-r text-sm from-green-700 to-cyan-500 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          @click="
            handleToggleModal(true);
            isIncome = true;
          "
        >
          <IconsPlus class="w-4 h-4" />
          Выставить счет
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UiInput placeholder="Поиск по названию, номеру счета, контрагенту" title="Поиск" v-model="searchQuery" :icon="IconsSearch" />

        <UiDropdown title="Статус" v-model="statusFilter">
          <option value="">Все статусы</option>
          <option v-for="status in statuses" :key="status" :value="status">
            {{ status }}
          </option>
        </UiDropdown>

        <UiDropdown title="Этапы" v-model="payStatusFilter">
          <option value="">Все этапы</option>
          <option v-for="entity in payStatuses" :key="entity.id" :value="entity.id">
            {{ entity.title }}
          </option>
        </UiDropdown>

        <UiDropdown v-model="legalEntityFilter" title="Юр. лицо">
          <option value="">Все юр. лица</option>
          <option v-for="entity in store.entities" :key="entity.id" :value="entity.id">
            {{ entity.title }}
          </option>
        </UiDropdown>

        <div class="flex flex-col items-start">
          <UiButton @click="hideCompleted = !hideCompleted" :variant="hideCompleted ? 'primary' : 'secondary'">
            <IconsClosedEye v-if="!hideCompleted" class="w-4 h-4 transition-all duration-200" />
            <IconsEye v-else class="w-4 h-4 transition-all duration-200" />
            <span class="transition-all duration-200">
              {{ hideCompleted ? "Показать завершенные" : "Скрыть завершенные" }}
            </span>
          </UiButton>
          <button
            v-if="route.query.id"
            @click="navigateTo('/applications')"
            class="mt-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors duration-200"
          >
            Вернуться ко всем заявкам
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 max-xl:grid-cols-1 gap-4">
      <template v-if="applications?.length">
        <ApplicationItem
          v-for="application in applications"
          :key="application.id"
          :application="application"
          @handleEdit="handleSaveApplication"
          @handleAdminChange="handleAdminChange"
        />
      </template>
      <template v-if="isAppsLoading">
        <SharedSkeleton v-for="i in 4" :count="1" height="h-full" rounded="rounded-lg" class="h-[500px]" />
      </template>
    </div>

    <span v-if="!applications.length && !isAppsLoading" class="flex items-center justify-center text-gray-600 dark:text-gray-400">
      {{ searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : "Нет заявок" }}
    </span>

    <div class="h-5" ref="anchor"></div>

    <Transition name="fade">
      <LazyApplicationModal
        v-if="isModalOpen"
        :error="null"
        :in-come="isIncome"
        :is-loading="isLoading"
        @submit="handleSaveApplication"
        @handle-toggle-modal="handleToggleModal"
      />
    </Transition>
    <Transition name="fade">
      <ApplicationSearch v-if="isSearchModalOpen" @handle-toggle-modal="handleToggleSearchModal" @update-applications="updateApplications" />
    </Transition>
  </NuxtLayout>
</template>

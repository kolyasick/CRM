<script setup lang="ts">

import type { IApplication } from "~/types/project";

const { user } = useUserSession();
const store = useGeneralStore();
const entityStore = useEntityStore();
const { addNotification } = useNotification();
const { show } = useConfirmModal();

const props = defineProps<{
  application: IApplication;
}>();

const emit = defineEmits<{
  (e: "handleAdminChange", applicationId: IApplication, status: string, manager: string): Promise<void>;
  (e: "handleEdit", application: IApplication): Promise<void>;
}>();

const isEditing = ref(false);
const isLoading = ref(false);

const handleToggleModal = (val: boolean) => {
  isEditing.value = val;
  store.switchBody(val);
};

const getStatusValue = (adminStatus: string, payStatus: string) => {
  if (adminStatus?.toLowerCase() === "отклонено") {
    return 5;
  } else if (adminStatus?.toLowerCase() === "согласовано" && payStatus.toLocaleLowerCase() === "оплачен") {
    return 100;
  } else if (adminStatus?.toLowerCase() === "согласовано" && payStatus.toLocaleLowerCase() !== "оплачен") {
    return 50;
  }

  return 5;
};

const getStatusColor = (adminStatus: string, payStatus: string) => {
  if (adminStatus?.toLowerCase() === "отклонено") {
    return "bg-red-500";
  } else if (adminStatus?.toLowerCase() === "согласовано" && payStatus.toLocaleLowerCase() === "оплачен") {
    return "bg-green-500";
  } else if (adminStatus.toLocaleLowerCase() === "согласовано" && payStatus.toLocaleLowerCase() !== "оплачен") {
    return "bg-yellow-500";
  }
  return "bg-red-500";
};

const getStatusText = (adminStatus: string | undefined) => {
  if (adminStatus?.toLowerCase() === "отклонено") {
    return "Отклонено";
  } else if (adminStatus?.toLowerCase() === "согласовано") {
    return "Согласовано";
  }
  return "Не согласовано";
};

const getAppColor = computed(() => {
  if (props.application.isPayed) {
    return "bg-gradient-to-r from-gray-600 to-gray-500";
  }

  if (props.application.isUrgent && props.application.payStatus?.title !== "Оплачен") {
    return "bg-gradient-to-r from-red-700 to-red-500";
  } else if (
    (!props.application.isUrgent && props.application.isIncome) ||
    (props.application.isIncome && props.application.payStatus?.title === "Оплачен")
  ) {
    return "bg-gradient-to-r from-green-700 to-cyan-500";
  } else if (props.application.isPayed) {
    return "bg-gray-100";
  } else {
    return "bg-gradient-to-r from-blue-700 to-blue-500";
  }
});

const handleEdit = async (application: IApplication) => {
  await emit("handleEdit", application);
};

const requestPayment = async (application: IApplication) => {
  show({
    title: "Запрос на получение П/П",
    message: "Вы уверены что хотите отправить запрос на получение П/П?",
    onConfirm: async () => {
      try {
        isLoading.value = true;

        if (application.isPaymentRequested) return;
        await store.sendStatusEmail("paymentRequest", application, user.value!.fullname);
        await $fetch(`/api/application/${application.id}/payment-request`);
        props.application.isPaymentRequested = true;
        addNotification("Запрос на получение П/П успешно отправлен", "success");
      } catch (error) {
        addNotification("Ошибка при отправлении П/П", "error");
        console.log(error);
      } finally {
        isLoading.value = false;
      }
    },
  });
};

const totalTax = computed(() => {
  return (props.application.sum * props.application.taxPercent) / (props.application.taxPercent + 100);
});

const actFile = ref<string | null>(props.application.actDocument);
const isActLoading = ref(false);

const attachAct = async (e: Event) => {
  try {
    isActLoading.value = true;
    const file = await useFileUpload(e, null);
    if (!file || !file.length) return;

    const res = await $fetch(`/api/application/${props.application.id}/attachAct`, {
      method: "PUT",
      body: {
        document: file ? file[0] : null,
        oldDocument: actFile.value?.split("_$_")[0] || null,
      },
    });
    actFile.value = file[0].name;
    addNotification("Акт успешно прикреплен", "success");
  } catch (error) {
    console.log("Ошибка при добавлении акта: ", error);
  } finally {
    isActLoading.value = false;
  }
};

const canEdit = computed(() => {
  if (!user.value) return false;
  if (props.application.adminStatus?.title === "Согласовано") return false;
  if (props.application.project?.managerId !== user.value.id && user.value.role !== "ADMIN") return false;

  return true;
});
</script>

<template>
  <div
    class="bg-white h-full dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between"
    :class="{
      'animate-pulse': application.isUrgent && application.payStatus?.title !== 'Оплачен',
    }"
  >
    <div>
      <div class="p-4 relative" :class="getAppColor">
        <h3 class="text-lg font-semibold text-white my-5 w-[calc(100%-60px)] break-all">
          {{ application.title }}
        </h3>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
          <h3 class="text-gray-800 dark:text-white font-bold text-lg mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 inline mr-2 text-gray-600 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Сумма заявки
          </h3>

          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600 dark:text-gray-300 flex flex-col">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span v-if="application.taxPercent || !application.isIncome"
                    >В том числе НДС {{ application.taxPercent ? application.taxPercent + "%" : "" }}</span
                  >
                  <span v-else>Итоговая сумма</span>
                </div>

                <div v-if="application.isIncome" class="flex items-center gap-2 mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ application.taxPercent ? "Сумма НДС:" : "Нет НДС" }}
                  <b v-if="application.taxPercent">{{ formatCurrency(totalTax) }}</b>
                </div>

                <div v-if="application.partSum" class="text-xs mt-2 underline text-blue-600 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  Заявка поделена, общая сумма:
                  <span class="ml-1 font-medium">{{ formatCurrency(application.sum) }}</span>
                </div>
              </span>

              <span class="text-gray-800 dark:text-white font-bold tabular-nums text-lg">
                {{ formatCurrency(application.adminStatus?.title === "Согласовано" ? application.partSum || application.sum : application.sum) }}
              </span>
            </div>
          </div>
        </div>
        <div class="text-blue-100 text-sm mt-1 absolute top-1 left-2 flex items-center gap-1">
          <IconsArrow class="w-5 h-5" :class="{ 'rotate-180': !application.isIncome }" />
          {{ application.isIncome ? "Счет" : "Заявка на оплату" }}
          <span class="text-xs">
            {{ "№" + application.id }}
          </span>
        </div>

        <div class="text-blue-100 text-xs mt-1 absolute top-1 right-2 flex flex-col gap-2 items-end">
          <button v-if="canEdit" @click="handleToggleModal(true)">
            <IconsPencil class="w-5 aspect-square" />
          </button>
          {{ new Date(application.createdAt).toLocaleDateString() }}
        </div>

        <div v-if="application.isUrgent && application.payStatus?.title !== 'Оплачен'" class="absolute top-2 left-1/2 -translate-x-1/2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Срочно
          </span>
        </div>
      </div>

      <div class="p-4 space-y-3">
        <div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Юр. лицо</p>
            <p class="font-medium dark:text-white">{{ application.legalEntity?.title }}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Поставщик</p>
            <p
              class="font-medium cursor-pointer text-blue-500 hover:underline truncate"
              @click="entityStore.openEntityModal(application.counterparty!.id, 'counterparty')"
            >
              {{ application.counterparty?.title }}
            </p>
          </div>
          <div v-if="!$route.path.includes('project')">
            <p class="text-sm text-gray-500 dark:text-gray-400">Проект</p>
            <NuxtLink :to="'/project/' + application.project?.id" class="font-medium cursor-pointer text-blue-500 hover:underline">
              {{ application.project?.title }}
            </NuxtLink>
          </div>
          <div v-if="application.document">
            <p class="text-sm text-gray-500 dark:text-gray-400">Документ</p>
            <a :href="'/uploads/' + application.document" target="_blank" class="font-medium text-blue-500">{{
              application.document.split("_$_")[0]
            }}</a>
          </div>
        </div>
        <div v-if="!application.isIncome">
          <p class="text-sm text-gray-500 dark:text-gray-400">На согласовании у:</p>
          <p class="font-medium dark:text-white">{{ application.moderator?.full_name }}</p>
        </div>

        <div v-if="application.positions?.length" class="w-full mb-2">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Наименование
                </th>

                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Кол-во</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ед. изм.
                </th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Сумма</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(pos, i) in application.positions" :key="i">
                <td class="px-3 py-4 text-sm text-gray-900 dark:text-white">
                  {{ pos.title }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {{ pos.qty }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {{ pos.unit }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {{ formatCurrency(pos.price) }}
                </td>
                <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(pos.sum) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 dark:bg-gray-700 p-4 border-t dark:border-gray-600">
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2 w-full">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Статус оплаты:</span>
          <span
            class="text-sm font-medium px-3 py-1 rounded-full"
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': application.payStatus?.title === 'Оплачен',
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200':
                application.payStatus?.title === 'Нет договора' || application.payStatus?.title === 'Подготовлено',
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
                application.payStatus?.title !== 'Оплачен' && application.payStatus?.title !== 'Нет договора',
            }"
          >
            {{ application.payStatus?.title }}
          </span>
        </div>
        <div v-if="!application.isIncome">
          <div class="flex items-center mb-3">
            <div class="flex items-center justify-between gap-2 w-full">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Статус согласования:</span>
              <span
                class="text-sm font-medium text-center px-2 py-1 rounded-full"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': application.adminStatus?.title === 'Согласовано',
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-gray-200':
                    application.adminStatus?.title === 'Отклонено' || application.adminStatus?.title !== 'Согласовано',
                }"
              >
                {{ getStatusText(application.adminStatus?.title) }}
              </span>
            </div>
          </div>

          <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-xl h-2.5 mb-4">
            <div
              class="h-2.5 rounded-full transition-all duration-300"
              :class="getStatusColor(application.adminStatus!.title, application.payStatus!.title)"
              :style="{
                width: getStatusValue(application.adminStatus!.title, application.payStatus!.title) + '%',
              }"
            ></div>
          </div>

          <div class="flex flex-wrap gap-2">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <template v-if="user?.role === 'ADMIN' && user.fullname === application.moderator?.full_name">
                  <button
                    v-if="application.adminStatus?.title !== 'Согласовано'"
                    @click="$emit('handleAdminChange', application, 'Согласовано', application.project?.manager?.full_name!)"
                    class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <IconsLoader class="w-5 h-5 animate-spin" v-if="isLoading" />
                    <div v-else class="inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      Согласовать
                    </div>
                  </button>
                  <button
                    v-if="application.adminStatus?.title === 'Не согласовано'"
                    @click="$emit('handleAdminChange', application, 'Отклонено', application.project?.manager?.full_name!)"
                    class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <IconsClose class="h-4 w-4" />
                    Отклонить
                  </button>
                </template>
                <template v-if="user && application.isPayed">
                  <button
                    @click="requestPayment(application)"
                    :disabled="application.isPaymentRequested"
                    class="inline-flex items-center gap-2 px-3 disabled:opacity-20 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <IconsLoader class="w-5 h-5 animate-spin" v-if="isLoading" />
                    <div v-else class="inline-flex items-center gap-1">
                      <IconsExclamanation class="w-4 h-4" />
                      {{ application.isPaymentRequested ? "Запрос на получение ПП отправлен" : "Запросить П/П" }}
                    </div>
                  </button>

                  <label
                    for="act"
                    class="cursor-pointer relative inline-flex items-center gap-2 px-3 disabled:opacity-20 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  >
                    <IconsLoader class="w-5 h-5 animate-spin" v-if="isActLoading" />
                    <div v-else class="inline-flex items-center gap-1">
                      <IconsClip class="w-4 h-4" />
                      <span class="max-w-52 truncate">
                        {{ actFile ? "Изменить акт" : "Прикрепить акт" }}
                      </span>
                    </div>
                    <input @change="attachAct" id="act" type="file" hidden />
                  </label>
                </template>
              </div>
              <div v-if="actFile" class="text-end">
                <p class="text-sm text-gray-500 dark:text-gray-400">Акт выполненных работ</p>
                <a :href="'/uploads/' + actFile" target="_blank" class="font-medium text-blue-500">{{ actFile.split("_$_")[0] }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Transition name="fade">
    <ApplicationModal
      v-if="isEditing"
      :application="application"
      :project-id="props.application.project?.id"
      :in-come="application.isIncome"
      :error="null"
      @submit="handleEdit"
      @handle-toggle-modal="handleToggleModal"
    />
  </Transition>
</template>

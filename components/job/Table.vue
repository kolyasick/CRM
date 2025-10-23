<script setup lang="ts">
import type { IJob } from "~/types/project";

const { user } = useUserSession();
const { addNotification } = useNotification();
const { show } = useConfirmModal();

const props = defineProps<{ jobs: IJob[]; totalSum: number; totalSumWithTax: number; totalSumWithAk: number; legalEntityId: number }>();
const emit = defineEmits<{
  (e: "updateJobs", job: IJob, type: string): void;
}>();

const editingJob = ref<IJob | null>(null);
const isModalOpen = ref(false);
const isLoading = ref(false);
const store = useGeneralStore();
const expandedJobs = ref<Set<number>>(new Set());

const toggleJobExpansion = (jobId: number) => {
  if (expandedJobs.value.has(jobId)) {
    expandedJobs.value.delete(jobId);
  } else {
    expandedJobs.value.add(jobId);
  }
};

const isJobExpanded = (jobId: number) => {
  return expandedJobs.value.has(jobId);
};

const handleToggleModal = (val: boolean, job?: IJob) => {
  if (job) editingJob.value = job;

  isModalOpen.value = val;
  store.switchBody(val);
};

const handleJobDelete = async (job: IJob) => {
  show({
    title: "Удаление работы",
    message: "Вы уверены что хотите удалить данную работу?",
    onConfirm: async () => {
      try {
        emit("updateJobs", job, "delete");
        await $fetch(`/api/project/${job.projectId}/job/${job.id}`, {
          method: "DELETE",
        });
        addNotification("Работа успешно удалена", "info");
      } catch (error) {
        console.log(error);
        addNotification("Ошибка при удалении работы", "error");
      }
    },
  });
};

const handleSaveJob = async (job: IJob) => {
  try {
    isLoading.value = true;
    addNotification("Работа успешно изменена", "success");
    const res = await $fetch<IJob>(`/api/job/${editingJob.value?.id}/edit`, {
      method: "PUT",
      body: job,
    });
    emit("updateJobs", res, "update");
    handleToggleModal(false);
  } catch (error: any) {
    console.log(error);
    addNotification(`Ошибка при изменении работы: ${error.data.message}`, "error");
  } finally {
    isLoading.value = false;
  }
};

const totalCost = computed(() =>
  props.jobs.reduce((acc, job) => {
    return acc + job.ourSum;
  }, 0)
);
</script>

<template>
  <div
    class="overflow-x-auto overflow-y-auto max-h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
  >
    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
      <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8">№</th>
          <!-- <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-8">Артикул</th> -->
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Наименование</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Кол-во</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ед.</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Поставщик</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена клиента</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Себестоимость</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Прибыль</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
        </tr>
      </thead>
      <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
        <template v-for="(job, jobIndex) in jobs" :key="job.id">
          <tr class="border-t-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer border-gray-200 dark:border-gray-700">
            <td class="px-2 py-4 text-center flex gap-2 items-center justify-center" @click="toggleJobExpansion(job.id)">
              <button
                v-if="job.details?.length"
                class="p-1 transition-transform duration-200"
                :class="{ 'transform rotate-90': isJobExpanded(job.id) }"
              >
                <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span class="text-gray-900 dark:text-white">{{ jobIndex + 1 }}.</span>
            </td>
            <!-- <td class="px-6 py-4 text-gray-900 dark:text-white font-medium">артикул</td> -->
            <td class="px-6 py-4 text-gray-900 dark:text-white font-medium" :title="job.title" @click="toggleJobExpansion(job.id)">
              {{ job.title }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{{ job.qty }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{{ job.unit }}</td>
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ formatCurrency(job.price) }}</td>
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{{ job.counterParty?.title }}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white font-semibold">{{ formatCurrency(job.sum) }}</td>
            <td class="px-6 py-4 text-gray-900 dark:text-white font-semibold">
              {{ formatCurrency(job.ourSum) }}
            </td>
            <td class="px-6 py-4 text-gray-900 dark:text-white font-semibold">
              {{ formatCurrency(job.sum - job.ourSum) }}
            </td>
            <td v-if="user" class="px-6 py-4 text-center">
              <button @click="handleToggleModal(true, job)" class="p-1 hover:scale-110 rounded mr-1">
                <IconsPencil class="w-5 h-5 text-orange-400" />
              </button>
              <button @click="handleJobDelete(job)" class="p-1 hover:scale-110 rounded">
                <IconsTrash class="w-5 h-5 text-red-400" />
              </button>
            </td>
          </tr>

          <template v-if="isJobExpanded(job.id) && job.details && job.details.length > 0">
            <tr
              v-for="(detail, detailIndex) in job.details"
              :key="detail.id"
              class="bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <td class="px-2 py-3"></td>
              <td class="px-6 py-3 text-gray-700 dark:text-gray-300">
                <div class="flex items-center gap-2 pl-8">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ detailIndex + 1 }}.</span>
                  <span class="max-w-[280px] truncate" :title="detail.title">{{ detail.title }}</span>
                </div>
              </td>
              <td class="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{{ detail.qty }}</td>
              <td class="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{{ detail.unit }}</td>
              <td class="px-6 py-3 text-gray-600 dark:text-gray-400">{{ formatCurrency(detail.price) }}</td>
              <td class="px-6 py-3 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">{{ detail.counterparty?.title }}</td>
              <td class="px-6 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400"></td>
              <td class="px-6 py-3 font-medium text-gray-700 dark:text-gray-300">
                {{ formatCurrency(detail.qty * detail.price) }}
              </td>
              <td colspan="2" class="px-6 py-3"></td>
            </tr>
          </template>
        </template>
      </tbody>

      <tfoot class="bg-gray-50 dark:bg-gray-700 sticky bottom-0">
        <tr>
          <td colspan="6" class="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-100 text-right">Итого по договору:</td>
          <td class="px-6 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
            {{ formatCurrency(totalSum) }}
          </td>
          <td class="px-6 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
            {{ formatCurrency(totalCost) }}
          </td>
          <td colspan="3" class="px-6 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300">{{ formatCurrency(totalSum - totalCost) }}</td>
        </tr>
      </tfoot>
    </table>

    <!-- @vue-ignore -->
    <JobModal
      v-if="isModalOpen"
      @submit="handleSaveJob"
      @handle-toggle-modal="handleToggleModal"
      :projectId="jobs[0]?.projectId"
      :is-loading="isLoading"
      :job="editingJob || undefined"
      :legal-entity-id="legalEntityId"
    />
  </div>
</template>

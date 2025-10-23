<script setup lang="ts">
import type { Counterparty, Job, JobDetail } from "@prisma/client";
import type { IJob } from "~/types/project";

const props = defineProps<{
  projectId: number;
  job?: IJob;
  legalEntityId: number;
  isLoading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: "handleToggleModal", value: boolean, job?: IJob): void;
  (e: "submit", job: Omit<Job, "id"> | IJob): Promise<void>;
}>();

const isTax = ref(!!props.job?.taxPercent || false);
const isDetailModalOpen = ref(false);
const selectedCounterparty = ref<Counterparty | null>(props.job?.counterParty || null);

const errors = reactive<Record<string, string | null>>({});

const form = ref({
  price: props.job?.price || 0,
  projectId: props.projectId,
  qty: props.job?.qty || 0,
  sum: props.job?.sum || 0,
  sumWithAk: 0,
  title: props.job?.title || "",
  unit: props.job?.unit || "",
  isAk: props.job?.isAk || false,
  ourSum: props.job?.ourSum || 0,
  counterPartyId: props.job?.counterPartyId || "",
  taxPercent: props.job?.taxPercent || 0,
  details: [...(props.job?.details || ([] as Omit<JobDetail, "id" | "jobId">[]))],
});

watch(form.value.details, () => {
  if (form.value.details.length) {
    form.value.ourSum = form.value.details.reduce((acc, d) => {
      return acc + d.price * d.qty;
    }, 0);
  } else {
    form.value.ourSum = 0;
  }
});

const addPosition = (pos: Omit<JobDetail, "id" | "jobId">) => {
  form.value.details.push(pos);
  isDetailModalOpen.value = false;
};

const deletePosition = (i: number) => {
  form.value.details.splice(i, 1);
};

const sum = computed(() => {
  return form.value.price * form.value.qty;
});

const sumWithTax = computed(() => {
  return sum.value;
});

const sumWithAk = computed(() => {
  if (!form.value.isAk) return sumWithTax.value;
  return sumWithTax.value * 1.1;
});

const handleSubmit = async () => {
  if (!selectedCounterparty.value && !form.value.details.length) {
    errors.counterparty = "Выберите контрагента";
    return;
  }
  if (!form.value.ourSum) {
    errors.ourSum = "Введите себестоимость";
    return;
  }

  // @ts-ignore
  await emit("submit", { ...form.value, sum: sum.value, sumWithAk: sumWithAk.value, counterPartyId: selectedCounterparty.value?.id });
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-6xl shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold dark:text-white">
          {{ job ? "Редактирование работы" : "Новая работа" }}
        </h3>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="emit('handleToggleModal', false)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="error" class="bg-red-50 mb-5 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700 dark:text-red-200">{{ error }}</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Описание</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Кол-во</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ед. изм.</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Цена за ед.</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Себестоимость</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr class="">
                <td class="px-2 py-3">
                  <input
                    type="text"
                    required
                    v-model="form.title"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                    placeholder="Описание работы"
                  />
                </td>
                <td class="px-2 py-3">
                  <input
                    type="number"
                    required
                    @input="form.qty = Math.abs(parseFloat(form.qty.toString())) || 0"
                    v-model="form.qty"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                  />
                </td>
                <td class="px-2 py-3">
                  <input
                    type="text"
                    required
                    @input="form.unit = form.unit.replace(/[^A-Za-zА-Яа-яЁё\s\.]/g, '')"
                    v-model="form.unit"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                    placeholder="шт., час, кг."
                  />
                </td>
                <td class="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    required
                    @input="form.price = Math.abs(parseFloat(form.price.toString())) || 0"
                    v-model="form.price"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                  />
                </td>
                <td class="px-4 py-3 relative">
                  <input
                    step="0.01"
                    type="number"
                    :disabled="!!form.details.length"
                    required
                    @input="
                      form.ourSum = Math.abs(parseFloat(form.ourSum.toString())) || 0;
                      errors.ourSum = null;
                    "
                    v-model="form.ourSum"
                    :class="errors.ourSum ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'"
                    class="w-full p-2 border-b disabled:dark:text-gray-600 disabled:text-gray-400 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                  />
                  <p class="opacity-50 text-[10px] text-gray-800 dark:text-white absolute">При добавлении позиций сумма подсчитается автоматически</p>

                  <span class="text-red-500 text-xs block mt-1" v-if="errors.ourSum">{{ errors.ourSum }}</span>
                </td>
                <td class="px-4 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                  {{ formatCurrency(sum) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <UiButton @click="isDetailModalOpen = true" variant="primary">
          <IconsPlus class="w-4 h-4 mr-1" />
          Добавить позиции
        </UiButton>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <CounterpartySearch v-if="!form.details.length" v-model="selectedCounterparty" :legal-entity-id="legalEntityId" title="Поставщик" />
            <span class="text-red-500 text-sm" v-if="errors.counterparty">{{ errors.counterparty }}</span>
          </div>

          <div class="flex items-center justify-end space-x-4">
            <div class="flex items-center">
              <input
                id="tax"
                type="checkbox"
                v-model="isTax"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <label for="tax" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">НДС</label>
            </div>

            <select
              v-if="isTax"
              required
              v-model="form.taxPercent"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option :value="0">Выберите НДС</option>
              <option :value="20">20%</option>
              <option :value="5">5%</option>
              <option :value="6">6%</option>
              <option :value="7">7%</option>
            </select>
          </div>
        </div>

        <div v-if="form.details.length > 0" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Детали позиций</label>
          <div class="overflow-x-auto max-h-40">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Наименование</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Ед. изм.</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Кол-во</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Цена</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Сумма</th>

                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300"></th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(pos, i) in form.details" :key="i">
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ pos.title }}</td>
                  <td class="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{{ pos.unit }}</td>
                  <td class="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">{{ pos.qty }}</td>
                  <td class="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">{{ formatCurrency(pos.price) }}</td>
                  <td class="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">{{ formatCurrency(pos.price * pos.qty) }}</td>
                  <td class="px-3 py-2">
                    <button type="button" @click="deletePosition(i)" class="text-red-500 hover:text-red-700 text-sm">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="text-sm text-gray-600 dark:text-gray-300">
            Итого с НДС: <span class="font-bold text-green-600 dark:text-green-400 ml-2">{{ formatCurrency(sumWithTax) }}</span>
          </div>

          <div class="flex gap-3">
            <UiButton @click="emit('handleToggleModal', false)" variant="secondary" :disabled="isLoading"> Отмена </UiButton>
            <UiButton type="submit" :loading="isLoading" variant="primary">
              <span>{{ props.job ? "Сохранить" : "Добавить" }}</span>
            </UiButton>
          </div>
        </div>
      </form>

      <JobDetailModal
        v-if="isDetailModalOpen"
        v-model:is-open="isDetailModalOpen"
        :counterparty="selectedCounterparty"
        :legal-entity-id="legalEntityId"
        @add-position="addPosition"
        @delete-position="deletePosition"
      />
    </div>
  </div>
</template>

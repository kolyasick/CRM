<script setup lang="ts">
import type { JobDetail } from "@prisma/client";
import type { CounterParty } from "~/types/project";

const props = defineProps<{
  counterparty: CounterParty | null;
  legalEntityId: number;
}>();

const emit = defineEmits<{
  (e: "update:isOpen", value: boolean): Promise<void>;
  (e: "addPosition", pos: Omit<JobDetail, "id" | "jobId">): void;
  (e: "deletePosition", index: number): void;
}>();

const isLoading = ref(false);
const selectedCounterparty = ref<CounterParty | null>(props.counterparty);

const errors = ref<Record<string, string>>({});

const form = ref<Omit<JobDetail, "id" | "jobId">>({
  price: 0,
  qty: 0,
  counterpartyId: "",
  title: "",
  unit: "",
});

const totalPositionsSum = computed(() => {
  return form.value.price * form.value.qty;
});

const addPosition = () => {
  if (!selectedCounterparty.value) {
    errors.value.counterparty = "Выберите поставщика";
    return;
  }
  emit("addPosition", { ...form.value, counterpartyId: selectedCounterparty.value?.id });
  form.value = {
    counterpartyId: "",
    price: 0,
    qty: 0,
    title: "",
    unit: "",
  };
  errors.value = {};
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[80vh] overflow-y-auto shadow-xl">
      <div class="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 p-6 z-10 border-b border-gray-600">
        <h3 class="text-xl font-semibold dark:text-white">Добавить позицию</h3>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          @click="emit('update:isOpen', false)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="addPosition" class="p-6">
        <div class="mb-6">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Описание</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Кол-во</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ед. изм.</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Цена за ед.</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-2 py-3">
                  <input
                    type="text"
                    v-model="form.title"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                    placeholder="Описание работы"
                  />
                </td>
                <td class="px-2 py-3">
                  <input
                    type="number"
                    @input="form.qty = Math.abs(parseFloat(form.qty.toString())) || 0"
                    v-model="form.qty"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                  />
                </td>
                <td class="px-2 py-3">
                  <input
                    type="text"
                    @input="form.unit = form.unit.replace(/[^A-Za-zА-Яа-яЁё\s\.]/g, '')"
                    v-model="form.unit"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                    placeholder="шт., час, кг."
                  />
                </td>
                <td class="px-2 py-3">
                  <input
                    type="number"
                    step="0.01"
                    @input="form.price = Math.abs(parseFloat(form.price.toString())) || 0"
                    v-model="form.price"
                    class="w-full p-2 border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white"
                  />
                </td>
                <td class="px-2 py-3 text-center font-semibold text-green-600 dark:text-green-400">
                  {{ formatCurrency(totalPositionsSum) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mb-2 w-1/2">
          <CounterpartySearch v-model="selectedCounterparty" :legal-entity-id="legalEntityId" title="" class="w-full" />
          <span class="text-red-500 text-xs block mt-1" v-if="errors.counterparty">{{ errors.counterparty }}</span>
        </div>

        <div class="flex justify-between items-center">
          <div class="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Итого: <span class="text-green-600 dark:text-green-400 ml-2">{{ formatCurrency(totalPositionsSum) }}</span>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              @click="$emit('update:isOpen', false)"
            >
              Отмена
            </button>

            <button
              type="submit"
              class="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors flex items-center"
            >
              <IconsLoader class="w-4 h-4 animate-spin mr-2" v-if="isLoading" />
              <span>Создать</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

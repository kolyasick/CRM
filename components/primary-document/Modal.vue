<script setup lang="ts">
import type { PrimaryDocument } from "@prisma/client";
import type { CounterParty, IPrimaryDocument } from "~/types/project";

const props = defineProps<{
  document?: IPrimaryDocument;
  isLoading: boolean;
  documentTypes: string[];
}>();

const emit = defineEmits<{
  (e: "toggleModal", value: boolean): void;
  (e: "handleSave", document: Omit<PrimaryDocument, "id"> | PrimaryDocument): Promise<void>;
}>();

const store = useGeneralStore();

const form = ref({
  amount: props.document?.amount || 0,
  documentLink: props.document?.documentLink || "",
  invoiceDate: formatDateForInput(props.document?.invoiceDate.toString()) || "",
  invoiceNumber: props.document?.invoiceNumber || "",
  paymentDate: props.document?.paymentDate ? formatDateForInput(props.document?.paymentDate.toString()) : null,
  projectId: props.document?.projectId || null,
  provisionDeadline: props.document?.provisionDeadline ? formatDateForInput(props.document?.provisionDeadline.toString()) : null,
  legalEntityId: props.document?.legalEntityId || null,
  type: props.document?.type || null,
});

const selectedCounterparty = ref<CounterParty | null>(props.document?.counterParty || null);

const errors = ref({
  amount: "",
  invoiceDate: "",
  invoiceNumber: "",
  paymentDate: "",
  projectId: "",
  legalEntityId: "",
  counterpartyId: "",
  type: "",
});

const validateForm = () => {
  let isValid = true;

  Object.keys(errors.value).forEach((key) => {
    // @ts-ignore
    errors.value[key] = "";
  });

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = "Сумма должна быть больше 0";
    isValid = false;
  }

  if (!form.value.invoiceDate) {
    errors.value.invoiceDate = "Дата счета обязательна";
    isValid = false;
  }

  if (!form.value.invoiceNumber.trim()) {
    errors.value.invoiceNumber = "Номер счета обязателен";
    isValid = false;
  }

  if (!form.value.paymentDate) {
    errors.value.paymentDate = "Дата оплаты обязательна";
    isValid = false;
  }

  if (!form.value.type) {
    errors.value.type = "Тип документа обязателен";
    isValid = false;
  }

  if (!form.value.legalEntityId) {
    errors.value.legalEntityId = "Юридическое лицо обязательно";
    isValid = false;
  }

  if (!form.value.projectId) {
    errors.value.projectId = "Проект обязателен";
    isValid = false;
  }

  if (!selectedCounterparty.value?.id) {
    errors.value.counterpartyId = "Контрагент обязателен";
    isValid = false;
  }

  return isValid;
};

const getInputClass = (fieldName: string) => {
  const baseClass = "w-full p-2 border-b focus:outline-none focus:ring-0 dark:bg-transparent dark:text-white";
  const errorClass = "border-red-500 text-red-900 dark:text-red-200";
  const normalClass = "border-gray-300 dark:border-gray-600";
  // @ts-ignore
  return `${baseClass} ${errors.value[fieldName] ? errorClass : normalClass}`;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  // @ts-ignore
  const res = emit("handleSave", {
    ...form.value,
    id: props.document?.id || undefined,
    counterpartyId: selectedCounterparty.value?.id,
  });
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-6xl w-full mx-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold dark:text-white">{{ props.document ? "Редактирование" : "Добавление" }} ПД</h3>
        <button
          @click="$emit('toggleModal', false)"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Дата счета <span class="text-red-500 ml-1">*</span>
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  № счета <span class="text-red-500 ml-1">*</span>
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Дата оплаты <span class="text-red-500 ml-1">*</span>
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Сумма <span class="text-red-500 ml-1">*</span>
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ссылка на документ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-2 py-3">
                  <input type="date" v-model="form.invoiceDate" required :class="getInputClass('invoiceDate')" placeholder="Введите дату счета" />
                  <div v-if="errors.invoiceDate" class="text-red-500 text-xs mt-1">{{ errors.invoiceDate }}</div>
                </td>
                <td class="px-2 py-3">
                  <input type="text" v-model="form.invoiceNumber" required :class="getInputClass('invoiceNumber')" placeholder="№ счета" />
                  <div v-if="errors.invoiceNumber" class="text-red-500 text-xs mt-1">{{ errors.invoiceNumber }}</div>
                </td>
                <td class="px-2 py-3">
                  <input type="date" v-model="form.paymentDate" required :class="getInputClass('paymentDate')" />
                  <div v-if="errors.paymentDate" class="text-red-500 text-xs mt-1">{{ errors.paymentDate }}</div>
                </td>
                <td class="px-2 py-3">
                  <input
                    type="number"
                    v-model="form.amount"
                    required
                    min="0"
                    step="0.01"
                    :class="getInputClass('amount')"
                    placeholder="Введите сумму"
                  />
                  <div v-if="errors.amount" class="text-red-500 text-xs mt-1">{{ errors.amount }}</div>
                </td>
                <td class="px-4 py-3 relative">
                  <input type="text" v-model="form.documentLink" placeholder="Введите ссылку на документ" :class="getInputClass('documentLink')" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="grid grid-cols-4 items-end gap-4">
          <UiDropdown title="Тип документа" v-model="form.type" required :error="errors.type">
            <option :value="null">Выберите тип документа</option>
            <option v-for="(type, index) in documentTypes" :key="index" :value="type">
              {{ type }}
            </option>
          </UiDropdown>

          <UiDropdown title="Юридическое лицо" v-model="form.legalEntityId" required :error="errors.legalEntityId">
            <option :value="null">Выберите юридическое лицо</option>
            <option v-for="entity in store.entities" :key="entity.id" :value="entity.id">
              {{ entity.title }}
            </option>
          </UiDropdown>

          <div>
            <CounterpartySearch
              v-model="selectedCounterparty"
              :legal-entity-id="form.legalEntityId"
              title="Контрагент"
              :error="errors.counterpartyId"
            />
            <div v-if="errors.counterpartyId" class="text-red-500 text-xs mt-1">{{ errors.counterpartyId }}</div>
          </div>
          <UiDropdown title="Выберите проект" v-model="form.projectId" required :error="errors.projectId">
            <option :value="null">Выберите проект</option>
            <option v-for="project in store.projects" :key="project.id" :value="project.id">
              {{ project.title }}
            </option>
          </UiDropdown>
        </div>
        <div class="flex justify-end items-center gap-2">
          <UiButton @click="$emit('toggleModal', false)" :disabled="isLoading" variant="secondary"> Отмена </UiButton>
          <UiButton type="submit" :loading="isLoading" variant="primary"> Добавить </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>

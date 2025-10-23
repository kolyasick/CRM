<script setup lang="ts">
import type { Counterparty, User, Position } from "@prisma/client";
import type { ServerFile } from "nuxt-file-storage";
import type { IApplication } from "~/types/project";

const store = useGeneralStore();

const props = defineProps<{
  projectId?: number;
  isLoading?: boolean;
  application?: IApplication;
  inCome?: boolean;
  error: string | null;
}>();

const { data: moderators } = await useFetch<User[]>("/api/user");

const emit = defineEmits<{
  (e: "handleToggleModal", value: boolean): void;
  (e: "submit", application: IApplication): Promise<void>;
}>();

const selectedCounterparty = ref<Counterparty | null>(props.application?.counterparty || null);

const newApplication = ref({
  accountNumber: props.application?.accountNumber || "",
  isIncome: props.application?.isIncome ?? props.inCome,
  sum: props.application?.sum ?? 0,
  counterpartyId: null as string | null,
  legalEntityId: props.application?.legalEntityId || (null as number | null),
  moderatorId: props.application?.moderatorId ?? "",
  accountDate: props.application?.accountDate ? formatDateForInput(String(props.application?.accountDate)) : formatDateForInput(String(new Date())),
  taxPercent: props.application?.taxPercent ?? 0,
  document: props.application?.document ?? (null as ServerFile | null),
  isUrgent: props.application?.isUrgent ?? false,
  projectId: props.projectId ? props.projectId : props.application?.projectId ? props.application.projectId : "",
  newProjectId: props.projectId ? props.projectId : props.application?.projectId ? props.application.projectId : "",
  positions: [...(props.application?.positions || ([] as Position[]))],
  partSum: props.application?.partSum || 0,
  comment: props.application?.comment || "",
  paymentType: props.application?.title.includes("Оплата по договору") ? "contract" : ("invoice" as "invoice" | "contract"),
  for: props.application?.title.toLowerCase().split("за")[1] || "",
});

const isPart = ref(!!props.application?.partSum);
const uploadError = ref(null);
const isPosModalOpen = ref(false);

watch(
  () => newApplication.value.newProjectId,
  (newId) => {
    if (props.application) return;

    const project = store.projects?.find((p) => p.id === newId);

    if (project && props.inCome) {
      // console.log(project.counterparty);
      selectedCounterparty.value = project.counterparty;
      newApplication.value.counterpartyId = project.counterparty.id;
      newApplication.value.legalEntityId = project.Legal_entity_id;
    }
  },
  {
    immediate: true,
  }
);

watch(
  selectedCounterparty,
  () => {
    newApplication.value.counterpartyId = selectedCounterparty.value?.id || null;
  },
  { immediate: true }
);

const sum = computed(() => {
  if (props.inCome) {
    return newApplication.value.positions.reduce((acc, job) => {
      return acc + job.sum;
    }, 0);
  }

  return newApplication.value.sum;
});

const sumWithTax = computed(() => {
  if (props.inCome) {
    const legalEntity = store.entities.find((l) => l.id === newApplication.value.legalEntityId);
    return newApplication.value.positions.reduce((acc, job) => {
      return acc + job.sum + (job.sum * (legalEntity?.tax || 1)) / 100;
    }, 0);
  }

  return newApplication.value.sum + (newApplication.value.sum * newApplication.value.taxPercent) / 100;
});

const errors = reactive<Record<string, string | null>>({});

const validateForm = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = null;
  });

  let isValid = true;

  if (!newApplication.value.accountDate) {
    errors.date = "Выберите дату";
    isValid = false;
  }

  if (!newApplication.value.newProjectId) {
    errors.project = "Выберите проект";
    isValid = false;
  }

  if (!props.inCome && (!newApplication.value.sum || newApplication.value.sum <= 0)) {
    errors.sum = "Введите сумму больше 0";
    isValid = false;
  }

  if (!props.inCome && !newApplication.value.moderatorId) {
    errors.moderator = "Выберите согласующее лицо";
    isValid = false;
  }

  if (!newApplication.value.legalEntityId) {
    errors.legalEntity = "Выберите юридическое лицо";
    isValid = false;
  }

  if (!newApplication.value.counterpartyId) {
    errors.counterparty = props.inCome ? "Выберите клиента" : "Выберите поставщика";
    isValid = false;
  }

  if (isPart.value && (!newApplication.value.partSum || newApplication.value.partSum <= 0)) {
    errors.partSum = "Введите сумму больше 0";
    isValid = false;
  }

  if (props.inCome && !newApplication.value.positions.length) {
    errors.positions = "Добавьте хотя бы одну позицию";
    isValid = false;
  }

  return isValid;
};
const handleSubmit = async () => {
  const project = store.projects.find((p) => p.id === newApplication.value.newProjectId);
  if (!validateForm()) return;
  try {
    if (props.application) {
      // @ts-ignore
      await emit("submit", {
        ...newApplication.value,
        project,
        counterparty: selectedCounterparty.value,
        id: props.application?.id,
        sum: sum.value,
        sumWithAK: sum.value,
        sumWithTax: sumWithTax.value,
        taxPercent: newApplication.value.taxPercent,
      });
      emit("handleToggleModal", false);
    } else {
      // @ts-ignore
      await emit("submit", {
        ...newApplication.value,
        project,
        counterparty: selectedCounterparty.value,
        sum: sum.value,
        sumWithAK: sum.value,
        sumWithTax: sumWithTax.value,
        taxPercent: newApplication.value.taxPercent,
      });
    }

    if (!props.isLoading && !props.error) {
      newApplication.value = {
        sum: 0,
        accountNumber: "",
        accountDate: "",
        counterpartyId: null,
        legalEntityId: null,
        isIncome: props.inCome ?? false,
        taxPercent: 0,
        document: null,
        isUrgent: false,
        projectId: props.projectId || "",
        newProjectId: props.projectId || "",
        positions: [],
        moderatorId: "",
        partSum: 0,
        comment: "",
        paymentType: "invoice",
        for: "",
      };
    }
  } catch (error) {
    console.error("Error creating application:", error);
  }
};

const handleFileSelect = async (event: Event) => {
  const files = await useFileUpload(event, uploadError.value);

  if (files && files.length > 0) {
    newApplication.value.document = files[0];
  }
};

const form = ref<Omit<Position, "id" | "applicationId">>({
  price: 0,
  qty: 0,
  sum: 0,
  title: "",
  unit: "",
});

const totalPositionsSum = computed(() => {
  return form.value.price * form.value.qty;
});

watch(
  () => form.value.title,
  () => {
    if (positionErrors.value.title) {
      positionErrors.value.title = "";
    }
  }
);

watch(
  () => form.value.qty,
  () => {
    if (positionErrors.value.qty) {
      positionErrors.value.qty = "";
    }
  }
);

watch(
  () => form.value.price,
  () => {
    if (positionErrors.value.price) {
      positionErrors.value.price = "";
    }
  }
);

watch(
  () => form.value.unit,
  () => {
    if (positionErrors.value.unit) {
      positionErrors.value.unit = "";
    }
  }
);

const validatePosition = () => {
  positionErrors.value = {
    title: "",
    qty: "",
    price: "",
    unit: "",
  };

  let isValid = true;

  if (!form.value.title.trim()) {
    positionErrors.value.title = "Введите описание работы";
    isValid = false;
  }

  if (!form.value.qty || form.value.qty <= 0) {
    positionErrors.value.qty = "Введите количество больше 0";
    isValid = false;
  }

  if (!form.value.price || form.value.price <= 0) {
    positionErrors.value.price = "Введите цену больше 0";
    isValid = false;
  }

  if (!form.value.unit.trim()) {
    positionErrors.value.unit = "Введите единицу измерения";
    isValid = false;
  }

  return isValid;
};

const addPosition = () => {
  if (!validatePosition()) {
    return;
  }

  // @ts-ignore
  newApplication.value.positions.push({ ...form.value, sum: totalPositionsSum.value });
  isPosModalOpen.value = false;
  form.value = { price: 0, qty: 0, sum: 0, title: "", unit: "" };
  positionErrors.value = { title: "", qty: "", price: "", unit: "" };
};

const deletePosition = (i: number) => {
  newApplication.value.positions.splice(i, 1);
};

const positionErrors = ref({
  title: "",
  qty: "",
  price: "",
  unit: "",
});

const formattedSum = computed({
  get() {
    const num = newApplication.value.sum;
    if (num === 0 || num === null || isNaN(num)) return "";

    return num.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  },
  set(value: string) {
    const cleanedValue = value.replace(/\s/g, "").replace(/[a-zA-Zа-яёА-ЯЁ]/g, "");

    const normalizedValue = cleanedValue.replace(/,/g, ".");

    if (!normalizedValue || normalizedValue === "-" || normalizedValue === ".") {
      newApplication.value.sum = 0;
      return;
    }

    const num = parseFloat(normalizedValue);

    if (!isNaN(num)) {
      const roundedNum = Math.round(num * 100) / 100;
      newApplication.value.sum = roundedNum;
    }
  },
});

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^\d,.-\s]/g, "");
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl shadow-xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold dark:text-white">
          {{ props.application ? "Редактирование заявки" : inCome ? "Выставление счета" : "Новая заявка" }}
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

      <div class="flex items-center space-x-2 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
        <input type="checkbox" v-model="newApplication.isUrgent" class="h-5 w-5 text-red-600 focus:ring-red-500 border-red-300 rounded" />
        <label class="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Срочная заявка
        </label>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div v-if="!props.application && typeof newApplication.document !== 'string'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Прикрепить файлы</label>
          <div v-if="newApplication.document" class="space-y-2">
            <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div class="flex flex-col">
                  <span class="text-sm text-gray-900 dark:text-gray-100">{{ newApplication.document.name.split("_$_")[0] }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(Number(newApplication.document.size)) }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="newApplication.document = null"
                class="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="props.application && newApplication.document && typeof newApplication.document === 'string'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Документ</label>
          <a
            download
            :href="'/uploads/' + props.application?.document"
            target="_blank"
            class="flex items-center justify-between px-2 py-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
          >
            <div class="flex items-center space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div class="flex flex-col">
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ props.application?.document?.split("_$_")[0] }}</span>
              </div>
            </div>
          </a>
        </div>
        <UiFileInput v-if="!props.application && !newApplication.document" multiple @handle-file-select="(e) => handleFileSelect(e)" />

        <div class="flex gap-3 items-end">
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"> Тип и номер </label>
            <div class="grid grid-cols-2 gap-2">
              <UiDropdown v-model="newApplication.paymentType" class="flex-1" required>
                <option selected value="invoice">Счет</option>
                <option value="contract">Договор</option>
              </UiDropdown>
              <UiInput v-model="newApplication.accountNumber" :regex="/[№NnНн]/g" placeholder="123456" required />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"> от ... </label>
            <UiInput v-model="newApplication.accountDate" type="date" required />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1"> за ... </label>
            <UiInput v-model="newApplication.for" placeholder="наклейки" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 items-start">
          <UiDropdown
            v-if="!props.projectId || props.application"
            title="Проект"
            :error="errors.project || undefined"
            @change="errors.project = null"
            v-model="newApplication.newProjectId"
            required
          >
            <option value="">Выберите проект</option>
            <option v-for="project in store.projects" :key="project.id" :value="project.id">
              {{ project.title }}
            </option>
          </UiDropdown>

          <UiInput
            v-if="!props.inCome"
            @input="
              onInput($event!);
              errors.sum = null;
            "
            required
            v-model="formattedSum"
            title="Сумма"
            placeholder="Введите сумму"
            :error="errors.sum || undefined"
          />

          <UiDropdown
            v-if="!newApplication.isIncome"
            required
            @change="errors.moderator = null"
            title="Согласовать с ..."
            :error="errors.moderator || undefined"
            v-model="newApplication.moderatorId"
          >
            <option value="">Выберите согл. лицо</option>
            <option v-for="moderator in moderators" :key="moderator.id" :value="moderator.id">
              {{ moderator.full_name }}
            </option>
          </UiDropdown>

          <UiDropdown
            v-if="!newApplication.isIncome"
            @change="errors.legalEntity = null"
            required
            title="Юридическое лицо"
            :error="errors.legalEntity || undefined"
            v-model="newApplication.legalEntityId"
          >
            <option :value="null">Выберите юридическое лицо</option>
            <option v-for="entity in store.entities" :key="entity.id" :value="entity.id">
              {{ entity.title }}
            </option>
          </UiDropdown>

          <div>
            <CounterpartySearch
              v-model="selectedCounterparty"
              :legal-entity-id="newApplication.legalEntityId"
              :title="inCome ? 'Клиент' : 'Поставщик'"
            />
            <p v-if="errors.counterparty" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.counterparty }}</p>
          </div>

          <UiInput class="col-span-2" v-model="newApplication.comment" title="Комментарий" placeholder="Любой комментарий" is-text-area />

          <div v-if="!inCome" class="flex flex-col justify-between">
            <div class="flex items-start">
              <input
                v-model="isPart"
                id="isPart"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <label for="isPart" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Разбить на части</label>
            </div>
            <UiInput
              v-if="isPart"
              v-model="newApplication.partSum"
              title="Сумма для данного проекта"
              @input="errors.partSum = null"
              :error="errors.partSum || undefined"
            />
          </div>
        </div>

        <div v-if="props.inCome || props.application?.isIncome" class="mt-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Позиции</label>

          <div class="w-full max-h-40 overflow-y-scroll mb-2">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Наименование
                  </th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ед. изм.
                  </th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Кол-во
                  </th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Цена</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Сумма</th>
                  <th scope="col" class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(pos, i) in newApplication.positions" :key="i">
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ pos.title }}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ pos.unit }}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ pos.qty }}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {{ formatCurrency(pos.price) }}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(pos.sum) }}
                  </td>
                  <td class="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <button type="button" @click="deletePosition(i)" class="text-red-500">Удалить</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="errors.positions" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ errors.positions }}</p>

          <div class="flex items-center justify-between">
            <UiButton @click="isPosModalOpen = true">
              <IconsPlus class="w-4 h-4 mr-2" />
              Добавить позиции
            </UiButton>
            <div class="text-gray-800 dark:text-white flex items-center gap-2">
              <span class="underline">Итого:</span>
              <b>{{ formatCurrency(sum) }}</b>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <UiButton @click="emit('handleToggleModal', false)" :disabled="isLoading" variant="secondary"> Отмена </UiButton>
          <UiButton type="submit" variant="primary" :loading="isLoading"> {{ props.application ? "Сохранить" : "Создать" }} </UiButton>
        </div>
      </form>
    </div>

    <ApplicationPositionModal v-model:is-open="isPosModalOpen" v-if="isPosModalOpen">
      <form @submit.prevent="addPosition" class="space-y-3 p-5">
        <UiInput title="Описание" required placeholder="Введите описание работы" v-model="form.title" :error="positionErrors.title" />

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Кол-во
              <span class="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              @input="form.qty = Math.abs(parseFloat(form.qty.toString())) || 0"
              v-model="form.qty"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white',
                positionErrors.qty ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600',
              ]"
              placeholder="Введите кол-во"
            />
            <p v-if="positionErrors.qty" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ positionErrors.qty }}
            </p>
          </div>
          <UiInput
            title="Ед. измерения"
            required
            placeholder="шт., час, кг."
            v-model="form.unit"
            :error="positionErrors.unit"
            :regex="/[^A-Za-zА-Яа-яЁё\s\.]/g"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >Стоимость за ед.
              <span class="text-red-500 ml-1">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              @input="form.price = Math.abs(parseFloat(form.price.toString())) || 0"
              v-model="form.price"
              :class="[
                'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white',
                positionErrors.price ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600',
              ]"
            />
            <p v-if="positionErrors.price" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ positionErrors.price }}
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <span class="text-gray-600 dark:text-gray-300">Итого:</span>
          <span class="font-medium dark:text-gray-100"> {{ formatCurrency(totalPositionsSum) }}</span>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <UiButton @click="isPosModalOpen = false" variant="secondary" :disabled="isLoading"> Отмена </UiButton>
          <UiButton type="submit" variant="primary" :loading="isLoading"> Добавить </UiButton>
        </div>
      </form>
    </ApplicationPositionModal>
  </div>
</template>

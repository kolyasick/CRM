<script setup lang="ts">
import type { Project_status, Legal_entity, Project_document, Counterparty } from "@prisma/client";
import type { IProject as proj, IProject } from "~/types/project";
import type { ServerFile } from "nuxt-file-storage";

type Project = proj & {
  new_files?: ServerFile[];
  deleted_files?: string[];
  hidden?: boolean;
};

const props = defineProps<{
  project: IProject | null;
  legalEntities: Legal_entity[];
  statuses?: Project_status[];
  isLoading: boolean;
  error: string | null;
  selectedStatusId: number | null;
}>();

const emit = defineEmits<{
  (e: "handleToggleModal", value: boolean): void;
  (e: "save", project: IProject | Omit<IProject, "id">): Promise<void>;
}>();

const selectedCounterparty = ref<Counterparty | null>(props.project?.counterparty || null);

const form = ref({
  title: props.project?.title || "",
  description: props.project?.description || "",
  sum: props.project?.sum || 0,
  payed_sum: props.project?.payed_sum || 0,
  counterparty_id: props.project?.counterparty_id || null,
  Legal_entity_id: props.project?.Legal_entity_id || null,
  status_id: props.project?.status_id || props.selectedStatusId || null,
  files: [] as ServerFile[],
  deleted_files: [] as string[],
  created_at: new Date(),
  deadline: formatDateForInput(String(props.project?.deadline)) || null,
  isPartner: props.project?.isPartner || false,
});

watch(
  () => form.value.Legal_entity_id,
  (newVal, oldVal) => {
    if (oldVal) {
      selectedCounterparty.value = null;
    }
  }
);

// Watchers для очистки ошибок валидации при изменении значений
watch(
  () => form.value.title,
  () => {
    if (validationErrors.value.title) {
      validationErrors.value.title = "";
    }
  }
);

watch(
  () => form.value.sum,
  () => {
    if (validationErrors.value.sum) {
      validationErrors.value.sum = "";
    }
  }
);

watch(
  () => form.value.Legal_entity_id,
  () => {
    if (validationErrors.value.Legal_entity_id) {
      validationErrors.value.Legal_entity_id = "";
    }
  }
);

watch(
  () => selectedCounterparty.value,
  () => {
    if (validationErrors.value.counterparty_id) {
      validationErrors.value.counterparty_id = "";
    }
  }
);

const uploadError = ref<string | null>(null);
const projectFiles = ref<Project_document[]>(props.project?.project_document || []);

const validationErrors = ref({
  title: "",
  sum: "",
  Legal_entity_id: "",
  counterparty_id: "",
});

const handleFileSelect = async (event: Event) => {
  const files = await useFileUpload(event, uploadError.value);

  if (files && files.length > 0) {
    form.value.files = [...form.value.files, ...files];
  }
};

const clearValidationErrors = () => {
  validationErrors.value = {
    title: "",
    sum: "",
    Legal_entity_id: "",
    counterparty_id: "",
  };
};

// Функция валидации формы
const validateForm = () => {
  let isValid = true;

  clearValidationErrors();

  if (!form.value.title.trim()) {
    validationErrors.value.title = "Введите название проекта";
    isValid = false;
  }

  if (!form.value.isPartner && (!form.value.sum || form.value.sum <= 0)) {
    validationErrors.value.sum = "Введите сумму проекта";
    isValid = false;
  }

  if (!form.value.Legal_entity_id) {
    validationErrors.value.Legal_entity_id = "Выберите юридическое лицо";
    isValid = false;
  }

  if (form.value.Legal_entity_id && !selectedCounterparty.value) {
    validationErrors.value.counterparty_id = "Выберите контрагента";
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  // @ts-ignore
  const projectData: Omit<Project, "id"> = {
    title: form.value.title,
    description: form.value.description,
    sum: form.value.sum,
    payed_sum: form.value.payed_sum,
    counterparty_id: selectedCounterparty.value?.id!,
    counterparty: selectedCounterparty.value!,
    Legal_entity_id: form.value.Legal_entity_id!,
    status_id: form.value.status_id!,
    deleted_files: form.value.deleted_files,
    new_files: form.value.files,
    project_document: [],
    Legal_entity: props.legalEntities.find((l) => l.id === form.value.Legal_entity_id)!,
    created_at: form.value.created_at,
    deadline: form.value.deadline ? new Date(form.value.deadline) : null,
    isPartner: form.value.isPartner,
  };

  if (props.project) {
    emit("save", { ...projectData, id: props.project.id });
  } else {
    emit("save", projectData);
  }
};

const removeFile = (file: ServerFile | Project_document, selectedFile: boolean) => {
  if (selectedFile) {
    const serverFile = file as ServerFile;
    form.value.files = form.value.files.filter((f) => f.name !== serverFile.name);
  } else {
    const projectFile = file as Project_document;
    form.value.deleted_files.push(projectFile.url);
    projectFiles.value = projectFiles.value.filter((f) => f.url !== projectFile.url);
  }
};

const handleCancel = () => {
  form.value = {
    title: "",
    description: "",
    sum: 0,
    payed_sum: 0,
    counterparty_id: null,
    Legal_entity_id: null,
    status_id: null,
    files: [],
    deleted_files: [],
    created_at: new Date(),
    deadline: null,
    isPartner: false,
  };
  clearValidationErrors();
  emit("handleToggleModal", false);
};

const formattedSum = computed({
  get() {
    const num = form.value.sum;
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
      form.value.sum = 0;
      return;
    }

    const num = parseFloat(normalizedValue);

    if (!isNaN(num)) {
      const roundedNum = Math.round(num * 100) / 100;
      form.value.sum = roundedNum;
    }
  },
});

const formattedPayedSum = computed({
  get() {
    const num = form.value.payed_sum;
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
      form.value.payed_sum = 0;
      return;
    }

    const num = parseFloat(normalizedValue);

    if (!isNaN(num)) {
      const roundedNum = Math.round(num * 100) / 100;
      form.value.payed_sum = roundedNum;
    }
  },
});

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  input.value = input.value.replace(/[^\d,.-\s]/g, "");
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-20">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ project ? "Редактирование" : "Добавление" }} проекта</h2>
        <button @click="handleCancel" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div v-if="error || uploadError" class="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
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
              <p class="text-sm text-red-700 dark:text-red-200">{{ error || uploadError }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <input type="checkbox" v-model="form.isPartner" class="h-5 w-5 text-red-600 focus:ring-red-500 border-red-300 rounded" />
          <label class="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Партнерский проект
          </label>
        </div>
        <UiInput type="text" placeholder="Название проекта" title="Название" required v-model="form.title" :error="validationErrors.title" />
        <UiInput placeholder="Описание проекта" title="Описание" v-model="form.description" is-text-area :rows="2" />

        <div v-if="!form.isPartner" class="grid gap-4" :class="{ 'grid-cols-2': !props.project }">
          <UiInput
            @input="(e) => onInput(e!)"
            type="text"
            required
            placeholder="Сумма проекта"
            title="Сумма"
            v-model="formattedSum"
            :error="validationErrors.sum"
          />

          <UiInput
            v-if="!props.project"
            v-model="formattedPayedSum"
            @input="(e) => onInput(e!)"
            type="text"
            placeholder="Оплаченная сумма"
            title="Оплачено"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UiDropdown title="Юр. лицо" required :error="validationErrors.Legal_entity_id" v-model="form.Legal_entity_id">
            <option :value="null">Выберите юр. лицо</option>
            <option v-for="entity in legalEntities" :key="entity.id" :value="entity.id">
              {{ entity.title }}
            </option>
          </UiDropdown>
          <div>
            <CounterpartySearch v-model="selectedCounterparty" :legal-entity-id="form.Legal_entity_id" />
            <p v-if="validationErrors.counterparty_id" class="mt-1 text-sm text-red-600 dark:text-red-400">
              {{ validationErrors.counterparty_id }}
            </p>
          </div>
        </div>

        <UiInput v-if="!props.project" v-model="form.deadline" type="date" title="Дедлайн" />

        <div v-if="projectFiles.length">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Файлы проекта</label>
          <div class="space-y-3">
            <div class="space-y-2">
              <span
                download
                target="_blank"
                :href="'/uploads/' + file.url"
                v-for="(file, index) in projectFiles"
                :key="file.id"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
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
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ file.url }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeFile(file, false)"
                  class="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Прикрепить файлы</label>
          <div class="space-y-3">
            <div v-if="form.files.length > 0" class="space-y-2">
              <div
                v-for="(file, index) in form.files"
                :key="index"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
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
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ file.name }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(Number(file.size)) }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeFile(file, true)"
                  class="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <UiFileInput multiple @handle-file-select="(e) => handleFileSelect(e)" />
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <UiButton @click="handleCancel" variant="secondary" :disabled="isLoading"> Отмена </UiButton>
          <UiButton type="submit" :loading="isLoading">
            <span>{{ project ? "Сохранить" : "Добавить" }}</span>
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>

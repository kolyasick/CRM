<script setup lang="ts">
import { type Closed_doc_status, type Project_document } from "@prisma/client";
import type { ServerFile } from "nuxt-file-storage";

const { user } = useUserSession();
const { addNotification } = useNotification();

const props = defineProps<{
  isReaded: boolean;
  statuses: Closed_doc_status[];
  isArchived: boolean;
  isEdo: boolean;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  (e: "handleChangeStatus", docId: number, value: number): Promise<void>;
  (e: "updateDocuments", docs: Project_document[]): Promise<void>;
  (e: "updateEdo", val: boolean): void;
}>();

const handleChangeStatus = async (docId: number, value: number) => {
  emit("handleChangeStatus", docId, value);
};

const isDocsLoading = ref(true);
const isFormOpen = ref(false);
const uploadError = ref<string | null>(null);
const isDocEditLoading = ref(false);
const isEdoLoading = ref(false);

const { params } = useRoute();

const projectDocuments = ref<Project_document[]>([]);
const actDocuments = ref<string[]>([]);
const existFiles = ref<Project_document[]>([]);

onBeforeMount(async () => {
  try {
    const res = await $fetch<{
      projectFiles: Project_document[] | [];
      actFiles: string[] | [];
    }>(`/api/project/${params.id}/document/findAll`);

    projectDocuments.value = res.projectFiles;
    actDocuments.value = res.actFiles;
    existFiles.value = [...res.projectFiles];
  } catch (error) {
    console.log(error);
  } finally {
    isDocsLoading.value = false;
  }
});

const newFiles = ref<ServerFile[]>([]);
const deletedFiles = ref<string[]>([]);
const isEDO = ref(props.isEdo || false);

watch(isEDO, async () => {
  if (isEDO.value) {
    try {
      isEdoLoading.value = true;
      const isDocsEDO = await $fetch<boolean>(`/api/project/${params.id}/edo`, {
        method: "PUT",
        body: {
          isEdo: isEDO.value,
        },
      });
      emit("updateEdo", isDocsEDO);
    } catch (error) {
      console.log(error);
    } finally {
      isEdoLoading.value = false;
    }
  }
});

const closeForm = () => {
  isFormOpen.value = false;
  existFiles.value = projectDocuments.value;
};

const handleFileSelect = async (event: Event) => {
  const files = await useFileUpload(event, uploadError.value);

  if (files && files.length > 0) {
    newFiles.value = [...newFiles.value, ...files];
  }
};

const removeFile = (file: ServerFile | Project_document, selectedFile: boolean) => {
  if (selectedFile) {
    const serverFile = file as ServerFile;
    newFiles.value = newFiles.value.filter((f) => f.name !== serverFile.name);
  } else {
    const projectFile = file as Project_document;
    deletedFiles.value.push(projectFile.url);
    existFiles.value = existFiles.value.filter((f) => f.url !== projectFile.url);
  }
};

const submit = async () => {
  try {
    isDocEditLoading.value = true;
    const docs = await $fetch<Project_document[]>(`/api/project/${params.id}/document/edit`, {
      method: "PUT",
      body: {
        newFiles: newFiles.value,
        deletedFiles: deletedFiles.value,
      },
    });

    projectDocuments.value = docs;
    existFiles.value = docs;
    isFormOpen.value = false;
    addNotification("Документы успешно отредактированы", "info");
  } catch (error) {
    console.log(error);
    addNotification("Ошибка при редактировании документов", "error");
  } finally {
    isDocEditLoading.value = false;
  }
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-t-lg shadow p-6 overflow-hidden">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-5">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Документы проекта</h2>

        <div
          v-if="user"
          :class="{ 'opacity-70': isEdo || isEdoLoading }"
          class="flex items-center select-none space-x-2 mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <input
            v-if="!isEdoLoading && !isEdo"
            :disabled="isEdo || isEdoLoading"
            type="checkbox"
            v-model="isEDO"
            id="edo"
            class="h-5 w-5 text-yellow-600 focus:ring-red-500 border-yellow-300 rounded"
          />
          <label for="edo" class="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <IconsLoader v-if="isEdoLoading" class="w-6 h-6 animate-spin" />
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Документы в ЭДО
          </label>
        </div>
      </div>
    </div>
    <div v-if="isDocsLoading">
      <SharedSkeleton :count="4" height="h-full" rounded="rounded-lg" class="h-72" />
    </div>
    <div v-else class="grid grid-cols-2 gap-3 relative h-full">
      <div class="space-y-2 pr-2">
        <div class="flex items-center justify-between">
          <h5 class="text-md font-medium text-gray-800 dark:text-white">Файлы проекта</h5>
          <button
            v-if="canEdit && !isReaded"
            @click="
              isFormOpen = true;
              newFiles = [];
              deletedFiles = [];
            "
          >
            <IconsPencil class="w-5 h-5 dark:text-white text-gray-800" />
          </button>
        </div>
        <div v-if="projectDocuments.length === 0" class="text-gray-500 dark:text-gray-400">Нет прикрепленных документов</div>
        <div v-else class="overflow-y-auto max-h-72 space-y-2 doc-list pr-1">
          <ProjectDocumentItem
            v-for="doc in projectDocuments"
            :key="doc.id"
            @handleChangeStatus="handleChangeStatus"
            :document="doc"
            :statuses="statuses"
          />
        </div>
      </div>

      <div class="absolute h-[calc(100%-60px)] left-1/2 top-0 bottom-0 w-[2px] rounded bg-gray-200 dark:bg-gray-700 -translate-x-1/2"></div>

      <div class="space-y-2 pl-2">
        <h5 class="text-md font-medium text-gray-800 dark:text-white">Акты</h5>
        <div v-if="actDocuments.length === 0" class="text-gray-500 dark:text-gray-400">Нет прикрепленных документов</div>
        <div v-else class="overflow-y-auto max-h-72 space-y-2 doc-list pr-1">
          <ProjectDocumentItem
            v-for="(doc, index) in actDocuments"
            :key="index"
            @handleChangeStatus="handleChangeStatus"
            :document="doc"
            :statuses="statuses"
          />
        </div>
      </div>
    </div>

    <div v-if="isFormOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <form @submit.prevent="submit" class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-20 space-y-6">
        <div class="text-gray-800 dark:text-white font-semibold text-2xl flex items-start justify-between">
          <h3>Редактирование файлов проекта</h3>
          <button @click="closeForm" type="button">
            <IconsClose class="w-8 h-8" />
          </button>
        </div>
        <div v-if="existFiles.length">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Файлы проекта</label>
          <div class="space-y-3">
            <div class="space-y-2">
              <span
                v-for="(file, index) in existFiles"
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
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ file.url.split("_$_")[0] }}</span>
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
            <div v-if="newFiles.length > 0" class="space-y-2">
              <div
                v-for="(file, index) in newFiles"
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
                    <span class="text-sm text-gray-900 dark:text-gray-100">{{ file.name.split("_$_")[0] }}</span>
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

            <div class="flex items-center justify-center w-full">
              <label
                class="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
              >
                <div class="flex flex-col items-center justify-center">
                  <svg class="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-semibold">Нажмите для загрузки</span>
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Любые файлы до 10MB</p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  class="hidden"
                  @dragover.prevent
                  @drop.prevent="handleFileSelect"
                  @change="handleFileSelect"
                />
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="closeForm"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            :disabled="isDocEditLoading"
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
          >
            <IconsLoader v-if="isDocEditLoading" class="w-5 h-5 animate-spin" />
            <span v-else>Сохранить</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.doc-list {
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.doc-list {
  scrollbar-color: #d1d5db #f3f4f6;
}

.dark .doc-list {
  scrollbar-color: #4b5563 #374151;
}

.doc-list::-webkit-scrollbar {
  width: 10px;
}

.doc-list::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

.doc-list::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 10px;
  border: 2px solid #f3f4f6;
}

.doc-list::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark .doc-list::-webkit-scrollbar-track {
  background: #374151;
}

.dark .doc-list::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border: 2px solid #374151;
}

.dark .doc-list::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}
</style>

<script setup lang="ts">
import type { Project_document, Project_status } from "@prisma/client";
// const { user } = useUserSession();
const props = defineProps<{
  document: Project_document | string;
  statuses: Project_status[];
}>();

const emit = defineEmits<{
  (e: "handleChangeStatus", docId: number, value: number): Promise<void>;
}>();

// const isDocEditing = ref(false);
const { addNotification } = useNotification();
// const docStatus = ref(props.document.status_id);

// const getStatusClass = (statusName: string) => {
//   if (statusName === "Не выставлены" || statusName === "Не сформированы") {
//     return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
//   } else if (statusName === "Сформированы") {
//     return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
//   } else {
//     return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
//   }
// };

// const getStatusName = (statusId: number) => {
//   const status = props.statuses.find((status) => status.id === statusId);

//   return status ? status.title : "";
// };

// watch(
//   () => docStatus.value,
//   async (newValue) => {
//     await handleChangeStatus(props.document.id, newValue);
//   }
// );

// const handleChangeStatus = async (docId: number, value: number) => {
//   await emit("handleChangeStatus", docId, value);
//   isDocEditing.value = false;
// };

const getDocumentLink = computed(() => {
  if (typeof props.document === "string") {
    return props.document;
  }
  return props.document.url;
});

const copyDocumentLink = () => {
  const config = useRuntimeConfig();
  try {
    const link = `${config.public.APP_URL}/uploads/${getDocumentLink.value}`;

    navigator.clipboard.writeText(link);
    addNotification("Ссылка скопиравана в буфер", "info", 2000);
  } catch (error) {
    addNotification("Ошибка при копировании ссылки", "error");
  }
};
</script>

<template>
  <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded">
    <div class="flex items-center justify-between gap-4 w-full">
      <span class="text-gray-900 dark:text-white truncate max-w-full">{{ getDocumentLink.split("_$_")[0] }}</span>
      <div class="flex items-center gap-3">
        <a
          :href="'/uploads/' + getDocumentLink"
          target="_blank"
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Открыть
        </a>
        <button class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300" @click="copyDocumentLink">
          <IconsCopy class="w-5 aspect-square" />
        </button>
      </div>
    </div>
  </div>
</template>

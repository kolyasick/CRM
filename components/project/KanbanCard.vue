<script setup lang="ts">
import type { IProject } from "~/types/project";

const props = defineProps<{
  project: IProject;
  isDragging: boolean;
}>();

const entityStore = useEntityStore();
const { user } = useUserSession();

const emit = defineEmits<{
  (e: "openEditModal", project: IProject): void;
  (e: "deleteProject", id: number): void;
  (e: "dragStart", event: DragEvent, projectId: number): void;
  (e: "dragEnd"): void;
}>();

const hiddenProjects = useCookie<number[]>("hiddenProjects");

const toggleHideProject = (project: IProject) => {
  if (hiddenProjects.value) {
    const isHidden = hiddenProjects.value.includes(project.id);
    if (isHidden) {
      project.hidden = false;
      hiddenProjects.value = hiddenProjects.value.filter((p) => p !== project.id);
    } else {
      project.hidden = true;
      hiddenProjects.value.push(project.id);
    }
  } else {
    hiddenProjects.value = [project.id];
  }
};

const isDeadlineNear = (deadline: Date | null) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7 && diffDays >= 0;
};

const isDeadlineOverdue = (deadline: Date | null) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  return deadlineDate < today;
};
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 p-4 py-8 overflow-hidden rounded-lg transition-all duration-200 shadow-md hover:shadow-lg cursor-grab group relative"
    :class="[
      { 'opacity-50 cursor-grabbing': isDragging },
      project.hidden ? 'max-h-24 hover:max-h-28 ' : 'max-h-full',
      { 'opacity-60 pointer-events-none cursor-not-allowed': !project.counterparty.isAgreed },
    ]"
    :draggable="project.managerId === user?.id || user?.role === 'ADMIN'"
    @dragstart="emit('dragStart', $event, project.id)"
    @dragend="emit('dragEnd')"
    @click="navigateTo(`/project/${project.id}`)"
  >
    <div v-if="project.hidden" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10"></div>
    <div class="font-semibold text-gray-700 dark:text-white mb-3 mt-5 2xl:text-lg text-base break-all">
      {{ project.title }}
    </div>
    <div class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 break-all">
      {{ project.description }}
    </div>
    <div class="flex flex-col gap-2">
      <div class="2xl:text-2xl text-xl font-bold text-blue-600 dark:text-blue-400">
        {{ formatCurrency(Number(project.sum)) }}
      </div>
      <div class="text-base flex gap-2 text-gray-600 dark:text-gray-400 mb-2">
        Оплачено:
        <span :class="project.payed_sum < project.sum ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'">
          {{ formatCurrency(Number(project.payed_sum)) }}</span
        >
      </div>
      <div class="flex flex-col justify-center items-start 2xl:text-sm text-xs">
        <span class="text-gray-500 dark:text-gray-500">Контрагент:</span>
        <button
          @click.stop="entityStore.openEntityModal(project.counterparty.id, 'counterparty')"
          class="flex flex-col font-semibold text-sm text-start text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 w-full truncate"
        >
          {{ project.counterparty.title }}
          <span v-if="!project.counterparty.isAgreed" class="text-xs text-gray-500 dark:text-gray-400 ml-1"> (на согласовании) </span>
        </button>
      </div>
      <div class="flex flex-col justify-center items-start 2xl:text-sm text-xs">
        <span class="text-gray-500 dark:text-gray-500">Юр. лицо:</span>
        <button
          @click.stop="entityStore.openEntityModal(project.Legal_entity.id, 'Legal_entity')"
          class="block truncate w-full font-semibold text-sm text-start text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {{ project.Legal_entity.title }}
        </button>
      </div>

      <span v-if="project.project_document.length" class="text-gray-500 dark:text-gray-500 text-sm"
        >Документы: {{ project.project_document.length }} шт.
      </span>

      <span v-else class="text-gray-500 dark:text-gray-500 text-sm">Нет документов</span>
      <span v-if="!project.is_readed" class="text-red-500 dark:text-red-500 text-sm">Не согласовано юристом</span>
    </div>
    <div class="absolute top-2 left-2 text-xs">
      <div v-if="project.deadline" class="text-xs opacity-70">
        <p
          :class="[
            'text-gray-400',
            {
              'text-red-600 dark:text-red-600': isDeadlineOverdue(project.deadline),
              'text-yellow-600 dark:text-yellow-600': isDeadlineNear(project.deadline) && !isDeadlineOverdue(project.deadline),
            },
          ]"
        >
          до: {{ formatDate(project.deadline) }}
        </p>
      </div>
      <div v-else class="text-xs text-gray-400 opacity-70">Без срока</div>
    </div>
    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" @click.stop="toggleHideProject(project)">
        <svg v-if="!project.hidden" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12">
          <path
            fill="currentColor"
            d="M3.81 9.606A6.2 6.2 0 0 0 6 10c2.51 0 4.48-1.453 5.79-3.341c.282-.394.28-.923.001-1.325a8.9 8.9 0 0 0-1.793-1.917l-.717.717a7.8 7.8 0 0 1 1.69 1.773a.15.15 0 0 1-.001.178C9.83 7.733 8.112 9 6 9a5.2 5.2 0 0 1-1.394-.19l-.797.796ZM7.396 3.19A5.2 5.2 0 0 0 6.001 3C3.89 3 2.173 4.267 1.025 5.924a.15.15 0 0 0 .005.17a7.8 7.8 0 0 0 1.69 1.772l-.717.717A8.9 8.9 0 0 1 .21 6.666a1.14 1.14 0 0 1 0-1.32C1.518 3.455 3.49 2 6 2a6.2 6.2 0 0 1 2.193.394l-.797.797ZM5.483 7.932a2.003 2.003 0 0 0 2.45-2.45L6.708 6.707zm-.189-2.639l1.225-1.225a2.003 2.003 0 0 0-2.45 2.45zm5.574-3.517a.454.454 0 0 0-.58-.695l-.063.052l-9.09 9.091a.455.455 0 0 0 .579.695l.063-.052l9.09-9.091Z"
          />
        </svg>
        <svg v-else class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 9a3.02 3.02 0 0 0-3 3c0 1.642 1.358 3 3 3s3-1.358 3-3s-1.359-3-3-3" />
          <path
            fill="currentColor"
            d="M12 5c-7.633 0-9.927 6.617-9.948 6.684L1.946 12l.105.316C2.073 12.383 4.367 19 12 19s9.927-6.617 9.948-6.684l.106-.316l-.105-.316C21.927 11.617 19.633 5 12 5m0 12c-5.351 0-7.424-3.846-7.926-5C4.578 10.842 6.652 7 12 7c5.351 0 7.424 3.846 7.926 5c-.504 1.158-2.578 5-7.926 5"
          />
        </svg>
      </button>
      <!-- <button class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" @click.stop="emit('openEditModal', project)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <button
        class="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        @click.stop="emit('deleteProject', project.id)"
      >
        <svg class="w-4 h-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z" />
        </svg>
      </button> -->
    </div>
  </div>
</template>

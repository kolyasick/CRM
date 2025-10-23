<script setup lang="ts">
import type { IProject } from "~/types/project";

const { addNotification, notifications } = useNotification();
const entityStore = useEntityStore();

const props = defineProps<{
  project: IProject;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  (e: "openEditModal"): void;
}>();

const isEditModalOpen = ref(false);

const isDeadlineNear = (
  deadline: Date | null
): {
  isNear: boolean;
  days: number;
} => {
  if (!deadline) {
    return {
      isNear: false,
      days: 0,
    };
  }
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isNear: diffDays <= 7 && diffDays >= 0,
    days: diffDays,
  };
};

const isDeadlineOverdue = (deadline: Date | null) => {
  if (!deadline) return false;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  return deadlineDate < today;
};

onMounted(() => {
  if (
    props.project.deadline &&
    props.project.Project_status.title !== "Сдан" &&
    props.project.Project_status.title !== "Отмена" &&
    props.project.Project_status.title !== "Проект завершен"
  ) {
    const { isNear, days } = isDeadlineNear(props.project.deadline);
    const isOverdue = isDeadlineOverdue(props.project.deadline);

    if (isOverdue) {
      const overdueDays = Math.abs(days);
      const daysWord = declension(overdueDays, ["день", "дня", "дней"]);

      let message;

      if (overdueDays === 0) {
        message = `Дедлайн проекта истекает сегодня`;
      } else {
        message = `Проект просрочен на ${overdueDays} ${daysWord}`;
      }

      addNotification(message, "error");
    } else if (isNear) {
      const daysWord = declension(days, ["день", "дня", "дней"]);

      let message;

      if (days === 1) {
        message = `Дедлайн проекта истекает завтра`;
      } else {
        message = `Дедлайн проекта истекает через ${days} ${daysWord}`;
      }

      addNotification(message, "warning");
    }
  }
});

onUnmounted(() => {
  notifications.value = [];
});
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white">Основная информация</h2>
      <button v-if="canEdit" @click="$emit('openEditModal')" class="dark:text-white text-gray-800">
        <IconsPencil class="w-5 h-5" />
      </button>
    </div>
    <div class="text-xl text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-5" v-if="project.isPartner">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      Партнерский проект*
    </div>
    <div class="space-y-4">
      <div v-if="!project.isPartner">
        <div class="text-sm text-gray-600 dark:text-gray-400">Контрагент</div>
        <button
          @click="entityStore.openEntityModal(project!.counterparty.id, 'counterparty')"
          class="text-blue-600 font-semibold text-wrap text-start hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {{ project?.counterparty.title }}
        </button>
      </div>

      <div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Юридическое лицо</div>
        <button
          @click="entityStore.openEntityModal(project!.Legal_entity.id, 'Legal_entity')"
          class="text-blue-600 font-semibold hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {{ project?.Legal_entity.title }}
        </button>
      </div>
      <div>
        <div class="text-sm text-gray-600 dark:text-gray-400">Статус проекта</div>
        <div class="px-3 py-1 mt-2 inline-flex text-sm font-semibold rounded-full" :class="useStatusClass(project?.Project_status.title)">
          {{ project?.Project_status.title }}
        </div>
      </div>
      <div v-if="project?.deadline">
        <div class="text-sm text-gray-600 dark:text-gray-400">*Дедлайн</div>
        <p
          :class="[
            {
              'text-gray-800 dark:text-white': !isDeadlineNear(project.deadline).isNear && !isDeadlineOverdue(project.deadline),
              'text-red-500': isDeadlineOverdue(project.deadline),
              'text-yellow-500': isDeadlineNear(project.deadline).isNear && !isDeadlineOverdue(project.deadline),
            },
          ]"
        >
          {{ formatDate(project.deadline) }}
          <span v-if="isDeadlineNear(project.deadline).isNear && !isDeadlineOverdue(project.deadline)" class="ml-2 text-sm text-yellow-500">
            Срок истекает!
          </span>
          <span v-if="isDeadlineOverdue(project.deadline)" class="ml-2 text-sm text-red-500">**Просрочен!</span>
        </p>
      </div>
    </div>
  </div>
</template>

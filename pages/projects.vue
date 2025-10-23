<script setup lang="ts">
import { IconsSearch } from "#components";
import type { Project_status } from "@prisma/client";
import type { IProject } from "~/types/project";

const route = useRoute();
const { addNotification } = useNotification();
const { show } = useConfirmModal();
const { user } = useUserSession();
const store = useGeneralStore();

const hideOthers = ref(true);
const hiddenProjects = useCookie<number[]>("hiddenProjects");
const searchQuery = useDebounceRef("", 300);

if (!hiddenProjects.value) hiddenProjects.value = [];

const queryParams = computed(() => ({
  id: route.query.id,
  managerId: user.value?.role === "ADMIN" ? undefined : hideOthers.value ? user.value?.id : undefined,
  q: searchQuery.value ? searchQuery.value : undefined,
}));

const {
  data: projects,
  pending,
  refresh,
} = await useFetch<IProject[]>("/api/project", {
  query: queryParams,
  transform: (response) =>
    response.map((project) => ({
      ...project,
      hidden: hiddenProjects.value?.includes(project.id),
    })),
});

// Отдельно настраиваем watchers
watch([hideOthers, searchQuery], () => {
  refresh();
});

const { data: statuses } = await useFetch<Project_status[]>("/api/project-status");

const groupedProjects = computed(() => {
  if (!projects.value || !statuses.value) return new Map();

  const groups = new Map<number, IProject[]>();
  statuses.value.forEach((status) => {
    groups.set(status.id, projects.value?.filter((project) => project.status_id === status.id) || []);
  });

  return groups;
});

const isLoading = ref(false);
const isDragging = ref(false);
const actionError = ref<string | null>(null);
const showModal = ref(false);
const editingProject = ref<IProject | null>(null);
const selectedStatusId = ref<number | null>(null);

const toggleModal = (val: boolean) => {
  showModal.value = val;
  store.switchBody(val);
};

const openAddModal = (statusId?: number) => {
  if (statusId) {
    selectedStatusId.value = statusId;
  } else {
    selectedStatusId.value = null;
  }
  editingProject.value = null;
  toggleModal(true);
};

const openEditModal = (project: IProject) => {
  editingProject.value = project;
  toggleModal(true);
};

const deleteProject = async (id: number) => {
  show({
    message: "Вы точно хотите удалить данный проект?",
    async onConfirm() {
      try {
        await $fetch("/api/project/" + id, { method: "DELETE" });
        const project = projects.value?.find((p) => p.id === id);
        projects.value = projects.value?.filter((p) => p.id !== id) || [];
        addNotification(`Проект "${project?.title}" удален`, "success");
      } catch (error) {
        console.log(error);
      }
    },
  });
};

const handleSave = async (project: IProject | Omit<IProject, "id">) => {
  const { counterparty, Legal_entity, Project_status, ...projectData } = project;
  try {
    isLoading.value = true;
    actionError.value = null;

    if (project.Legal_entity_id !== project.counterparty?.legalEntityId) {
      const newId = await store.createCounterParty({ ...project.counterparty, legalEntityId: project.Legal_entity_id }, project.Legal_entity.dbName!);
      if (!newId) {
        addNotification("Ошибка при создании нового контрагента", "error", null);
        return;
      }
      projectData.counterparty_id = newId;
    }

    if ("id" in project) {
      const response = await $fetch<IProject>(`/api/project/${project.id}`, {
        method: "PUT",
        body: projectData,
      });

      projects.value = projects.value?.map((p) => (p.id === project.id ? { ...p, ...response } : p)) || [];
      addNotification(`Проект "${project.title}" обновлен`, "success");
    } else {
      const response = await $fetch<IProject>("/api/project", {
        method: "POST",
        body: projectData,
      });
      // @ts-ignore
      if (projectData.new_files.length) await store.sendStatusEmail("newProject", null, user.value?.fullname!, response);
      await store.getEntities();

      if (projects.value) {
        projects.value.unshift(response);
        addNotification(`Проект "${response.title}" добавлен`, "success");
      } else {
        projects.value = [response];
      }
    }

    toggleModal(false);
    editingProject.value = null;
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка";
    console.error("Ошибка при сохранении проекта:", error);
  } finally {
    isLoading.value = false;
  }
};

const updateLocalProjectStatus = (projectId: number, newStatusId: number) => {
  if (!projects.value) return;
  const projectIndex = projects.value.findIndex((p) => p.id === projectId);

  if (projectIndex === -1) return;

  const updatedProject = {
    ...projects.value[projectIndex],
    status_id: newStatusId,
    status: statuses.value?.find((s) => s.id === newStatusId) || projects.value[projectIndex].Project_status,
  };

  const filteredProjects = projects.value.filter((p) => p.id !== projectId);

  projects.value = [...filteredProjects, updatedProject];
};

const onDragStart = (e: DragEvent, projectId: number) => {
  if (!user.value) return;
  const project = projects.value?.find((p) => p.id === projectId);

  if (project?.managerId !== user.value?.id && user.value.role !== "ADMIN") {
    e.preventDefault();
    return;
  }
  e.dataTransfer?.setData("projectId", projectId.toString());
  isDragging.value = true;
};

const onDrop = async (e: DragEvent, newStatusId: number) => {
  isDragging.value = false;
  const projectId = e.dataTransfer?.getData("projectId");
  if (!projectId) return;

  const projectIdNum = parseInt(projectId);
  const project = projects.value?.find((p) => p.id === projectIdNum);
  const status = statuses.value?.find((s) => s.id === newStatusId);
  if (!project || project.status_id === newStatusId) return;

  const oldProjectOrder = [...(projects.value || [])];

  try {
    isLoading.value = true;
    if (status?.title === "Проект завершен" && user.value?.role !== "LAWYER" && user.value?.role !== "ACCOUNTANT" && user.value?.role !== "ADMIN") {
      return;
    } else if (status?.title === "Отмена") {
      show({
        message: 'Вы уверены, что хотите переместить проект в статус "Отмена"? Проект автоматически будет заархивирован',
        onConfirm: async () => {
          await $fetch(`/api/project/${projectId}/status`, {
            method: "PUT",
            body: { status: status?.title },
          });
          projects.value = projects.value?.filter((p) => p.id !== projectIdNum) || [];
          addNotification(`Проект "${project?.title}" перемещен в архив`, "info");
        },
      });
    } else {
      updateLocalProjectStatus(projectIdNum, newStatusId);
      await $fetch(`/api/project/${projectId}/status`, {
        method: "PUT",
        body: { status: status?.title },
      });
    }
  } catch (error: any) {
    projects.value = oldProjectOrder;
    console.error("Ошибка при обновлении статуса:", error);
  } finally {
    isLoading.value = false;
  }
};

useHead({
  title: "MCRM | Проекты",
  meta: [{ name: "description", content: "MCRM |Управление проектами" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <div>
      <div class="flex justify-between items-center">
        <SharedPageTitle title="Проекты" subtitle="Управление проектами" />

        <div class="flex justify-between gap-2 items-center">
          <UiButton v-if="user" @click="openAddModal()">
            <IconsPlus class="w-4 aspect-square" />
            Добавить проект
          </UiButton>
        </div>
      </div>
    </div>

    <div class="mt-6 mb-2 flex items-end gap-4">
      <UiInput
        class="max-w-[500px] w-full"
        title="Поиск"
        v-model="searchQuery"
        placeholder="Поиск по названию, контрагенту, менеджеру"
        :icon="IconsSearch"
        variant="minimal"
      />

      <UiButton v-if="user" @click="hideOthers = !hideOthers" :variant="hideOthers ? 'primary' : 'secondary'">
        <IconsClosedEye v-if="!hideOthers" class="w-4 h-4 transition-all duration-200" />
        <IconsEye v-else class="w-4 h-4 transition-all duration-200" />
        <span class="transition-all duration-200">
          {{ hideOthers ? "Показать все проекты" : "Скрыть чужие проекты" }}
        </span>
      </UiButton>
    </div>

    <div v-if="!projects?.length && !pending" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
      {{ searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : "Нет проектов" }}
    </div>

    <div class="relative grid gap-4 h-full" :style="`grid-template-columns: repeat(${statuses?.length}, minmax(0, 1fr))`">
      <div
        v-for="status in statuses?.sort((a, b) => a.id - b.id)"
        :key="status.id"
        class="min-h-[calc(100vh-200px)]"
        @dragover.prevent
        @drop="onDrop($event, status.id)"
      >
        <div class="h-full flex flex-col kanban-column">
          <ProjectKanbanStatuses :status="status" />
          <div
            class="space-y-3 flex-1 border-dashed border-x"
            :class="[isDragging ? 'dark:border-gray-600 border-gray-400' : 'dark:border-gray-900 border-gray-100']"
          >
            <template v-for="(project, index) in groupedProjects.get(status.id) || []" :key="project.id">
              <div class="last:sticky last:top-20 grid transition-all duration-200">
                <ProjectKanbanCard
                  :class="{ 'opacity-50': pending }"
                  :project="project"
                  :is-dragging="isDragging"
                  @delete-project="deleteProject"
                  @open-edit-modal="openEditModal"
                  @drag-start="onDragStart"
                  @drag-end="isDragging = false"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="pending" class="absolute inset-0 flex items-center justify-center z-50">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-32 aspect-square animate-spin text-gray-600 dark:text-gray-300" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8s3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10"
        />
      </svg>
    </div>

    <Transition name="fade">
      <LazyProjectModal
        v-if="showModal"
        :project="editingProject"
        :legal-entities="store.entities || []"
        :is-loading="isLoading"
        :error="actionError"
        :selected-status-id="selectedStatusId"
        @save="handleSave"
        @handle-toggle-modal="toggleModal"
      />
    </Transition>
  </NuxtLayout>
</template>

<style scoped>
.toggleOthers {
  display: flex;
  align-items: center;
  padding: calc(0.5rem - 1px) calc(1rem - 1px);
  --tw-text-opacity: 1;
  border: 1px solid rgb(37 99 235 / var(--tw-bg-opacity, 1));
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.375rem;
  gap: 0.5rem;
  box-sizing: border-box;
  cursor: pointer;
}
.toggleOthers svg {
  width: 0.875rem;
  height: 0.875rem;
}
.toggleOthers.toggled {
  background-color: rgb(37 99 235 / var(--tw-bg-opacity, 1));
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}
.toggleOthers.toggled svg {
  color: rgb(255 255 255 / var(--tw-text-opacity, 1));
}
</style>

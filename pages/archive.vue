<script setup lang="ts">
import { IconsSearch } from "#components";
import type { IProject } from "~/types/project";

const route = useRoute();

const searchQuery = ref("");

const queryParams = computed(() => ({
  id: route.query.id,
  isArchived: 1,
}));

const { data: projects } = await useFetch<IProject[]>("/api/project", {
  query: queryParams,
  transform: (response) =>
    response.map((project) => ({
      ...project,
    })),
});

const filteredProjects = computed(() => {
  if (!searchQuery.value?.trim()) {
    return projects.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return projects.value?.filter(
    (project) =>
      project.title.toLowerCase().includes(query) ||
      project.manager?.full_name?.toLowerCase().includes(query) ||
      project.counterparty?.title?.toLowerCase().includes(query)
  );
});

useHead({
  title: "MCRM | Архив проектов",
  meta: [{ name: "description", content: "MCRM | Список архивных проектов" }],
});
</script>
<template>
  <NuxtLayout name="page-layout">
    <SharedPageTitle class="mb-5" title="Архивные проекты" subtitle="Доступны только для просмотра" />

    <div class="mt-6 mb-5 flex items-end gap-4">
      <UiInput
        class="max-w-[500px] w-full"
        title="Поиск"
        placeholder="Поиск по названию, контрагенту, менеджеру"
        v-model="searchQuery"
        variant="minimal"
        :icon="IconsSearch"
      />
    </div>
    <ul v-if="filteredProjects?.length" class="grid grid-cols-4 gap-4">
      <li v-for="p in filteredProjects" :key="p.id">
        <ProjectKanbanCard :project="p" :is-dragging="false" class="h-full" />
      </li>
    </ul>
    <div class="text-gray-600 dark:text-gray-400" v-else>{{ searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : "Архив пуст" }}</div>
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

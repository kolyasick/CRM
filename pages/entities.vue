<script setup lang="ts">
import type { Legal_entity } from "@prisma/client";

const route = useRoute();
const { addNotification } = useNotification();
const { show } = useConfirmModal();
const { user } = useUserSession();

const { data, error } = await useFetch<Legal_entity[]>("/api/legal_entity", {
  query: route.query.id ? { id: route.query.id } : undefined,
});
const isLoading = ref(false);
const actionError = ref<string | null>(null);
const showModal = ref(false);
const editingEntity = ref<Legal_entity | null>(null);

const handleEdit = (entity: any) => {
  editingEntity.value = entity;
  showModal.value = true;
};

const handleAdd = () => {
  editingEntity.value = null;
  showModal.value = true;
};

const handleSave = async (entity: Legal_entity | Omit<Legal_entity, "id" | "tax" | "dbName" | "bankAccount">) => {
  try {
    isLoading.value = true;
    actionError.value = null;

    if ("id" in entity) {
      const response = await $fetch<Legal_entity>(`/api/legal_entity/${entity.id}`, {
        method: "PUT",
        body: entity,
      });

      data.value = data.value?.map((e) => (e.id === entity.id ? { ...e, ...response } : e)) || [];
      addNotification(`Юр. лицо "${entity.title}" обновлено`, "success");
    } else {
      const response = await $fetch<Legal_entity>("/api/legal_entity", {
        method: "POST",
        body: entity,
      });

      if (data.value) {
        data.value.push(response);
        addNotification(`Юр. лицо "${response.title}" добавлено`, "success");
      } else {
        data.value = [response];
      }
    }

    showModal.value = false;
    editingEntity.value = null;
  } catch (error: any) {
    actionError.value = error.data.message;
  } finally {
    isLoading.value = false;
  }
};

const confirmDelete = async (entity: Legal_entity) => {
  show({
    message: `Вы уверены, что хотите удалить "${entity.title}"?`,
    async onConfirm() {
      try {
        isLoading.value = true;
        actionError.value = null;

        await $fetch(`/api/legal_entity/${entity.id}`, {
          method: "DELETE",
        });
        // data.value = data.value?.filter((e) => e.id !== entity.id) || [];

        const e = data.value?.find((e) => e.id === entity.id);
        if (e) {
          data.value = data.value?.filter((e) => e.id !== entity.id) ?? [];
          addNotification(`Юр. лицо "${entity.title}" удалено`, "success");
        }
      } catch (error: any) {
        addNotification("Что-то пошло не так", "error");
        actionError.value = error.data.message;
      } finally {
        isLoading.value = false;
      }
    },
  });
};

useHead({
  title: "MCRM | Юр. лица",
  meta: [{ name: "description", content: "MCRM | Управление юридическими лицами" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <SharedPageTitle title="Наши юр. лица" subtitle="Управление юридическими лицами" />
        <UiButton v-if="user" @click="handleAdd"> Добавить юр. лицо </UiButton>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div v-if="error" class="text-red-500 mb-4">Ошибка загрузки данных: {{ error.message }}</div>
      <div v-if="!data?.length" class="text-gray-600 dark:text-gray-400">Юр. лица не найдены</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        <LegalEntityCard v-for="entity in data" :key="entity.id" :entity="entity" @edit="handleEdit" @delete="confirmDelete" />
      </div>
    </div>

    <Transition name="fade">
      <LegalEntityModal v-model="showModal" :entity="editingEntity" :is-loading="isLoading" :error="actionError" @save="handleSave" />
    </Transition>
  </NuxtLayout>
</template>

export const useEntityStore = defineStore("entity", () => {
  const showEntityModal = ref(false);
  const selectedEntity = ref<number | string | null>(null);
  const selectedEntityType = ref<"counterparty" | "Legal_entity">("counterparty");
  function openEntityModal(entityId: number | string, type: "counterparty" | "Legal_entity") {
    selectedEntity.value = entityId;
    selectedEntityType.value = type;
    showEntityModal.value = true;
  }

  return {
    openEntityModal,
    showEntityModal,
    selectedEntity,
    selectedEntityType,
  };
});

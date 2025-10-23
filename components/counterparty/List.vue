<script setup lang="ts">
import type { CounterParty } from "~/types/project";

defineProps<{
  counterparties: CounterParty[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: "openEditModal", counterparty: CounterParty): void;
  (e: "confirmDelete", counterparty: CounterParty): void;
  (e: "approve", counterparty: CounterParty): void;
}>();
</script>

<template>
  <div>
    <div v-if="counterparties.length" class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 m-5">
      <CounterpartyItem
        v-for="counterparty in counterparties"
        :key="counterparty.id"
        :counterparty="counterparty"
        @open-edit-modal="emit('openEditModal', counterparty)"
        @confirm-delete="emit('confirmDelete', counterparty)"
        @approve="emit('approve', counterparty)"
      />
    </div>
    <div class="text-center dark:text-gray-400 text-gray-600 my-5" v-else-if="!counterparties.length && !isLoading">Ничего не найдено</div>
  </div>
</template>

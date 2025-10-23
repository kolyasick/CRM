<script setup lang="ts">
import type { BankAccount, Legal_entity } from "@prisma/client";
import type { CounterParty } from "~/types/project";

const props = defineProps<{
  modelValue: boolean;
  entityId: number | string | null;
  type: "counterparty" | "Legal_entity";
}>();

type ILegalEntity = Legal_entity & {
  bankAccount?: BankAccount;
};

const data = ref<CounterParty | ILegalEntity | null>(null);
const isLoading = ref(false);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const endPoint = props.type === "counterparty" ? `/api/counterparty?id=${props.entityId}` : `/api/legal_entity?id=${props.entityId}`;

onMounted(async () => {
  try {
    isLoading.value = true;
    const res = await $fetch<CounterParty[] | ILegalEntity[]>(endPoint);
    data.value = res[0];
  } catch (e) {
    console.log(e);
  } finally {
    isLoading.value = false;
  }
});

const title = computed(() => {
  if (!props.entityId) return "";
  return props.type === "counterparty" ? "Информация о контрагенте" : "Информация о юридическом лице";
});
</script>

<template>
  <div
    v-if="modelValue"
    @click.self="$emit('update:modelValue', false)"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ title }}</h2>
        <button @click="$emit('update:modelValue', false)" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="!isLoading && data" class="space-y-3">
        <CounterpartyItem v-if="type === 'counterparty'" :counterparty="data as CounterParty" />
        <LegalEntityCard v-else-if="type === 'Legal_entity'" :entity="data as ILegalEntity" />
      </div>

      <SharedSkeleton v-else-if="isLoading" :count="3" height="h-full" rounded="rounded-lg" class="h-96" />
    </div>
  </div>
</template>

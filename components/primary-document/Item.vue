<script setup lang="ts">
import type { IPrimaryDocument } from "~/types/project";

const entityStore = useEntityStore();
const config = useRuntimeConfig();
const { user } = useUserSession();

const props = defineProps<{
  document: IPrimaryDocument;
}>();

const emit = defineEmits<{
  (e: "handleEdit", value: boolean, doc?: IPrimaryDocument): void;
}>();

const canEdit = computed(() => {
  if (!user.value) return false;
  if (props.document.managerId !== user.value.id && user.value.role !== "ADMIN") return false;
  return true;
});

const shouldBlink = computed(() => {
  if (!props.document.provisionDeadline) return false;

  const deadline = new Date(props.document.provisionDeadline);
  const today = new Date();

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays <= 3 && diffDays >= 0;
});

const isOverdue = computed(() => {
  if (!props.document.provisionDeadline) return false;

  const deadline = new Date(props.document.provisionDeadline);
  const today = new Date();

  return deadline.getTime() < today.getTime();
});
</script>

<template>
  <tr
    :class="[
      'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
      {
        'animate-pulse bg-red-100 dark:bg-red-900/30': shouldBlink,
        'bg-red-300 dark:bg-red-900/80': isOverdue && !shouldBlink,
      },
    ]"
  >
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="text-sm font-medium text-gray-900 dark:text-white">
        {{ formatDate(document.invoiceDate) }}
      </div>
      <div class="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] text-wrap">№{{ document.invoiceNumber }}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="text-sm text-gray-900 dark:text-white">{{ document.legalEntity?.title }}</div>
    </td>
    <td class="px-6 py-4">
      <div
        @click="entityStore.openEntityModal(document.counterpartyId, 'counterparty')"
        class="text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline max-w-[200px] line-clamp-2"
      >
        {{ document.counterParty?.title }}
      </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div v-if="!document.applicationId" class="text-sm text-gray-900 dark:text-white">
        {{ document.application?.paymentDate ? formatDate(document.application?.paymentDate) : "Не оплачен" }}
      </div>
      <div v-else class="text-sm text-gray-900 dark:text-white">
        {{ document.paymentDate ? formatDate(document.paymentDate) : "Не оплачен" }}
      </div>
    </td>
    <td class="px-6 py-4 space-y-2">
      <NuxtLink
        :to="'/project/' + document.project?.id"
        class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline max-w-[200px] truncate block"
        >{{ document.project?.title }}</NuxtLink
      >
      <div class="text-sm font-semibold text-green-600 dark:text-green-400">
        {{ formatCurrency(document.amount) }}
      </div>
      <div class="text-xs text-gray-500 dark:text-gray-400">{{ document.manager?.full_name }}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div
        :class="[
          'text-sm font-medium',
          {
            'text-red-600 dark:text-red-400 animate-pulse': shouldBlink,
            'text-red-700 dark:text-red-300': isOverdue && !shouldBlink,
            'text-gray-900 dark:text-white': !shouldBlink && !isOverdue,
          },
        ]"
      >
        {{ document.provisionDeadline ? formatDate(document.provisionDeadline) : "-" }}
        <div v-if="shouldBlink" class="text-xs text-red-500 dark:text-red-400 mt-1">
          Осталось {{ Math.ceil((new Date(document.provisionDeadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) }} дн.
        </div>
        <div v-else-if="isOverdue" class="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">Просрочено</div>
      </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div v-if="document.documentLink" class="flex flex-col text-sm max-w-[200px]">
        <a
          class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline truncate"
          :href="document.documentLink.includes('http') ? document.documentLink : `${config.public.APP_URL}/uploads/${document.documentLink}`"
          target="_blank"
        >
          {{
            document.documentLink.includes("http")
              ? document.documentLink.split("/")[document.documentLink.split("/").length - 1]
              : document.documentLink
          }}
        </a>
      </div>
      <span v-else class="text-sm text-gray-900 dark:text-white">-</span>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="text-sm text-gray-900 dark:text-white">{{ document.status }}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
      <button v-if="canEdit" @click="$emit('handleEdit', true, document)">
        <IconsPencil class="w-5 h-5 dark:text-gray-500 text-gray-400" />
      </button>
    </td>
  </tr>
</template>

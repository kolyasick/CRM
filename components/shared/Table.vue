<script setup lang="ts">
type Props = {
  fields: string[];
};

const props = defineProps<Props>();
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              v-for="field in fields"
              :key="field"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {{ field }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <slot name="rows" />
        </tbody>
      </table>
    </div>

    <slot name="empty" />
  </div>
</template>

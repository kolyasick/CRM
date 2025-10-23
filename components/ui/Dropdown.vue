<script lang="ts" setup>
type Props = {
  title?: string;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
};

const props = defineProps<Props>();

const emits = defineEmits<{
  (e: "change", event?: Event): void;
}>();

const value = defineModel<any>();
</script>

<template>
  <div>
    <label v-if="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {{ title }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <select
      v-model="value"
      @change="$emit('change', $event)"
      :disabled
      :class="[
        'w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-35',
        error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600',
      ]"
      :required
    >
      <slot />
    </select>

    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>

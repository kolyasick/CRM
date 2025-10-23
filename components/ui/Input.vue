<script lang="ts" setup>
import type { Component } from "vue";

type Props = {
  placeholder?: string;
  title?: string;
  type?: string;
  error?: string | null;
  required?: boolean;
  isTextArea?: boolean;
  rows?: number;
  disabled?: boolean;
  regex?: RegExp;
  icon?: Component;
  variant?: "default" | "modern" | "minimal" | "filled" | "outline";
  size?: "sm" | "md" | "lg";
};

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  size: "md",
});

const value = defineModel<any>();

const emits = defineEmits<{
  (e: "input", event?: Event): void;
  (e: "update:modelValue", val: any): void;
}>();

if (props.regex) {
  watch(value, () => (value.value = value.value.replace(props.regex, "")), {
    immediate: true,
  });
}

const inputClasses = computed(() => {
  const baseClasses = [
    "w-full border rounded-md focus:outline-none  dark:bg-gray-700 dark:text-white",
    props.disabled ? "opacity-50 cursor-not-allowed" : "",
  ];

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-3 py-2 text-base",
    lg: "px-4 py-3 text-lg",
  }[props.size];

  const variantClasses = {
    default: ["border-gray-300 dark:border-gray-600", "focus:ring-2 focus:ring-blue-500 focus:border-blue-500", "shadow-sm"],
    modern: ["border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800", "focus:ring-2 focus:ring-blue-500 focus:border-blue-500", "shadow-sm"],
    minimal: ["border-transparent bg-gray-50 dark:bg-gray-800", "focus:ring-1 focus:ring-blue-500"],
    filled: ["border-transparent bg-gray-100 dark:bg-gray-600", "focus:ring-2 focus:ring-blue-500"],
    outline: ["border-2 border-gray-200 dark:border-gray-600 bg-transparent", "focus:border-blue-500 focus:ring-0"],
  }[props.variant];

  const errorClasses = props.error ? "border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500" : "";

  return [...baseClasses, sizeClasses, ...variantClasses, errorClasses, { "pl-10": props.icon }];
});

const labelClasses = computed(() => {
  return [
    "block text-sm font-medium mb-1 transition-colors duration-200",
    props.error ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300",
  ];
});
</script>

<template>
  <div class="input-wrapper">
    <label v-if="title" :class="labelClasses">
      {{ title }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <div class="relative">
      <textarea
        v-if="isTextArea"
        v-model="value"
        @input="$emit('input', $event)"
        :rows="rows"
        :disabled="disabled"
        :placeholder="placeholder"
        :required="required"
        :class="inputClasses"
      ></textarea>

      <label v-else-if="icon" class="relative block">
        <component
          :class="[
            'absolute left-3 transition-colors duration-200',
            size === 'sm' ? 'top-2.5 h-4 w-4' : size === 'lg' ? 'top-3.5 h-5 w-5' : 'top-2.5 h-5 w-5',
            error ? 'text-red-500' : 'text-gray-400',
          ]"
          :is="icon"
        />
        <input
          :type="type || 'text'"
          @input="$emit('input', $event)"
          v-model="value"
          :class="inputClasses"
          :placeholder="placeholder"
          :required="required"
          :disabled="disabled"
        />
      </label>

      <input
        v-else
        :type="type || 'text'"
        @input="$emit('input', $event)"
        v-model="value"
        :class="inputClasses"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
      />

      <div v-if="error" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.input-wrapper {
  position: relative;
}

/* Анимация фокуса для outline варианта */
.input-wrapper:focus-within .focus-ring {
  @apply ring-2 ring-blue-500 ring-opacity-50;
}

/* Стили для disabled состояния */
input:disabled,
textarea:disabled {
  @apply cursor-not-allowed;
}

/* Кастомный скролл для textarea */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-700 rounded;
}

textarea::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-500 rounded;
}

textarea::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-400;
}
</style>

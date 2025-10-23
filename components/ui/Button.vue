<script setup lang="ts">
type Props = {
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  type: "button",
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
});

const emits = defineEmits<{
  (e: "click"): any;
}>();

const buttonClasses = computed(() => {
  const baseClasses = [
    "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 ",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ];

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }[props.size];

  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700  dark:bg-blue-700 dark:hover:bg-blue-800",
    secondary:
      "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50  dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600",
    outline:
      "text-blue-600 bg-transparent border border-blue-600 hover:bg-blue-50  dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20",
    ghost: "text-gray-700 bg-transparent hover:bg-gray-100  dark:text-gray-300 dark:hover:bg-gray-600",
    danger: "text-white bg-red-600 hover:bg-red-700  dark:bg-red-700 dark:hover:bg-red-600",
    success: "text-white bg-green-600 hover:bg-green-700  dark:bg-green-700 dark:hover:bg-green-600",
  }[props.variant];

  const borderClass =
    props.variant !== "ghost" && props.variant !== "primary" && props.variant !== "danger" && props.variant !== "success" ? "border" : "";

  return [...baseClasses, sizeClasses, variantClasses, borderClass];
});
</script>

<template>
  <button :type="type" @click="$emit('click')" :disabled="disabled || loading" :class="buttonClasses">
    <IconsLoader class="w-4 h-4 animate-spin" v-if="loading" />

    <slot v-else />
  </button>
</template>

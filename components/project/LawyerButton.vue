<script setup lang="ts">
const { user } = useUserSession();
const props = defineProps<{
  isReaded: boolean;
  isCorrection: boolean;
}>();

const emit = defineEmits<{
  (e: "handleLawyerCheck"): Promise<void>;
  (e: "update:isReaded", value: boolean): void;
  (e: "handleCorrection"): Promise<void>;
  (e: "update:isCorrection", value: boolean): void;
}>();

const localIsReaded = computed({
  get: () => props.isReaded,
  set: (value) => emit("update:isReaded", value),
});

const localIsCorrection = computed({
  get: () => props.isCorrection,
  set: (value) => emit("update:isCorrection", value),
});
</script>

<template>
  <div>
    <div class="mt-4 flex items-center">
      <label
        class="relative inline-flex items-center"
        :class="[localIsReaded || user?.role !== 'LAWYER' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer']"
      >
        <input
          type="checkbox"
          v-model="localIsReaded"
          @change="emit('handleLawyerCheck')"
          class="sr-only peer"
          :checked="localIsReaded"
          :disabled="localIsReaded || user?.role !== 'LAWYER'"
        />
        <div
          class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
        ></div>
      </label>
      <div class="flex items-center gap-2 ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span> Прочитано юристом </span>
        <Transition mode="out-in" name="slide">
          <IconsDone v-if="localIsReaded" class="w-7 aspect-square text-green-500" />
          <IconsPlus v-else class="w-7 aspect-square text-red-500 rotate-45" />
        </Transition>
      </div>
    </div>
    <div class="mt-4 flex items-center">
      <label
        class="relative inline-flex items-center"
        :class="[localIsCorrection || localIsReaded || user?.role !== 'LAWYER' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer']"
      >
        <input
          type="checkbox"
          v-model="localIsCorrection"
          @change="emit('handleCorrection')"
          class="sr-only peer"
          :checked="localIsCorrection"
          :disabled="localIsCorrection || localIsReaded || user?.role !== 'LAWYER'"
        />
        <div
          class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"
        ></div>
      </label>
      <div class="flex items-center gap-2 ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span> {{ localIsCorrection ? "Направлено на правки" : "Направить на правки" }} </span>
        <Transition mode="out-in" name="slide">
          <IconsDone v-if="localIsCorrection" class="w-7 aspect-square text-yellow-500" />
          <IconsPlus v-else class="w-7 aspect-square text-gray-400 rotate-45" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
</style>

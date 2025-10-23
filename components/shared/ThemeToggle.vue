<script setup lang="ts">
const darkMode = useCookie<boolean>("crm-darkMode");

const switchTheme = () => {
  darkMode.value = !darkMode.value;
};
</script>

<template>
  <button
    @click="switchTheme"
    :class="darkMode ? 'text-white' : 'text-black'"
    :title="darkMode ? 'Переключить на светлую тему' : 'Переключить на темную тему'"
  >
    <Transition name="theme" mode="out-in">
      <IconsDarkMode v-if="darkMode" class="w-5 h-5" />
      <IconsLightMode v-else class="w-5 h-5" />
    </Transition>
  </button>
</template>

<style scoped>
.theme-enter-active,
.theme-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.theme-enter-from,
.theme-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}
</style>

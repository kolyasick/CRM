<script setup lang="ts">
const { notifications, removeNotification } = useNotification();
</script>

<template>
  <div style="z-index: 9999" class="fixed space-y-2 top-8 right-8 inline-flex flex-col items-end gap-2">
    <TransitionGroup name="notification">
      <div
        @click="removeNotification(notification.id)"
        v-for="notification in notifications"
        :key="notification.id"
        class="p-4 rounded-lg shadow-lg min-w-52 relative max-w-96 overflow-hidden"
        :class="{
          'bg-green-100 text-green-800': notification.type === 'success',
          'bg-red-100 text-red-800': notification.type === 'error',
          'bg-blue-100 text-blue-800': notification.type === 'info',
          'bg-yellow-100 text-yellow-800': notification.type === 'warning',
        }"
      >
        <div class="flex items-center justify-between relative">
          <div class="text-sm font-medium break-words w-full">{{ notification.message }}</div>
          <button @click="removeNotification(notification.id)" class="ml-4 text-current hover:opacity-75 absolute -top-9 -right-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          class="absolute rounded-lg bottom-0 left-0 h-1"
          :class="{
            'bg-green-500': notification.type === 'success',
            'bg-red-500': notification.type === 'error',
            'bg-blue-500': notification.type === 'info',
            'bg-yellow-500': notification.type === 'warning',
          }"
          :style="{ width: `${notification.progress}%` }"
        ></div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

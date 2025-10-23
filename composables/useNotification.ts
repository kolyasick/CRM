export type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  progress: number;
  duration: number | null;
  startTime: number;
}

const notifications = ref<Notification[]>([]);
let nextId = 1;

export function useNotification() {
  const addNotification = (message: string, type: NotificationType = "info", duration: number | null = 0) => {
    const id = nextId++;
    const startTime = Date.now();
    const notification: Notification = {
      id,
      message,
      type,
      progress: 100,
      duration,
      startTime,
    };

    if (notifications.value.length > 3) {
      notifications.value.shift();
    }
    notifications.value.unshift(notification);

    if (duration && duration > 0) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progress = (remaining / duration) * 100;

        const index = notifications.value.findIndex((n) => n.id === id);
        if (index !== -1) {
          notifications.value[index].progress = progress;
        }

        if (remaining <= 0) {
          clearInterval(interval);
          removeNotification(id);
        }
      }, 10);
    }
  };

  const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
}

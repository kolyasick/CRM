import { formatDistanceToNow } from "date-fns";
import { ru, enUS } from "date-fns/locale";

export function useRelativeTime(dateInput: string | Date, lang: string = "ru") {
  const formattedDate = ref("");

  const updateTime = () => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 7) {
      formattedDate.value = formatDistanceToNow(date, {
        addSuffix: true,
        locale: lang === "ru" ? ru : enUS,
      });
    } else {
      formattedDate.value = formatDate(date);
    }
  };

  updateTime();

  const intervalId = setInterval(updateTime, 60000);

  return formattedDate.value;
}

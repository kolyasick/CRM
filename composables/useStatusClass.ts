export const useStatusClass = (status: string | undefined): string => {
  switch (status) {
    case "Новый":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "На согласовании":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "В работе":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Правки":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "Отмена":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "Сдан":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case "Проект завершен":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function formatDate(dateInput: string | Date, short?: boolean, isDDMMYY?: boolean): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("ru-RU", {
    year: short ? "2-digit" : "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

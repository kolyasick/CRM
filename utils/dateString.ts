export const dateString = (date: Date): string => {
  const accountDate = new Date(date);
  const year = accountDate.getFullYear();
  const month = String(accountDate.getMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0
  const day = String(accountDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}${month}${day}`;
  return formattedDate;
};

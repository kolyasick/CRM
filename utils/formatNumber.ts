export const formatNumber = (value: string | number): string => {
  const cleanValue = String(value).replace(/\D/g, "");

  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(cleanValue));
};

export const parseFormattedNumber = (value: string): number => {
  return Number(value.replace(/\D/g, ""));
};

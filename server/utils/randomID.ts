export const generateRandomString = (length: number = 6): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomValues = new Uint32Array(length);

  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => chars[v % chars.length])
    .join("");
};

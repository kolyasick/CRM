export const formatFileName = (fileName: string, maxLength = 20): string => {
  if (!fileName) return "Документ";
  const extension = fileName.split(".").pop();

  return fileName.length > maxLength 
    ? `${fileName.slice(0, maxLength)}...${extension}` 
    : fileName;
};

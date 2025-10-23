export const useFileUpload = async (event: Event, uploadError: string | null) => {
  const input = event.target as HTMLInputElement;

  if (!input.files?.length) return;

  try {
    const files = Array.from(input.files);
    let result = [];
    for (const file of files) {
      if (file.size > 1024 * 1024 * 50) {
        uploadError = "Размер файла превышает 50MB";
        break;
      }

      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileName = file.name;
      const fileExt = file.name.split(".").pop();
      const lastDotIndex = fileName.lastIndexOf(".");
      const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);

      const fileWithContent = {
        content: base64Content,
        lastModified: file.lastModified.toString(),
        name: nameWithoutExtension + "_$_" + new Date().getTime() + "." + fileExt,
        size: file.size.toString(),
        type: file.type || "application/octet-stream",
        webkitRelativePath: "",
      };

      result.push(fileWithContent);
    }

    return result;
  } catch (error) {
    uploadError = (error as any).data.message;
  }
};

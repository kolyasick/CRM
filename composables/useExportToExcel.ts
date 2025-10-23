export const useExportToExcel = (excelData: any[], title: string) => {
  const isExportLoading = ref(false);

  async function handleExport() {
    try {
      if (!excelData || !excelData.length) return;
      isExportLoading.value = true;

      const XLSX = await import("xlsx-js-style");
      const wb = XLSX.utils.book_new();

      const ws = XLSX.utils.json_to_sheet(excelData);

      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };

      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:K1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: range.s.r, c: C });
        if (!ws[address]) continue;
        ws[address].s = headerStyle;
      }

      const dataRange = XLSX.utils.decode_range(ws["!ref"] || "A1:K1");
      for (let R = dataRange.s.r + 1; R <= dataRange.e.r; ++R) {
        for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[address]) continue;
          ws[address].s = {
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      }

      ws["!cols"] = Object.keys(excelData[0]).map(() => ({ width: 20 }));

      XLSX.utils.book_append_sheet(wb, ws, title);

      const fileName = `${title}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Ошибка при экспорте в Excel:", error);
    } finally {
      isExportLoading.value = false;
    }
  }
  return {
    isExportLoading,
    handleExport,
  };
};

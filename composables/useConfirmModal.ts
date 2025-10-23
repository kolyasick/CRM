type ConfirmData = {
  title?: string;
  message: string;
  onConfirm: () => Promise<void> | void;
};

const isOpen = ref(false);

const confirmData = ref<ConfirmData>({
  title: "",
  message: "",
  onConfirm: () => {},
});

export function useConfirmModal() {
  const show = (data: ConfirmData) => {
    confirmData.value = data;
    if (!data.title) confirmData.value.title = "Подтверждение действия";
    isOpen.value = true;
  };

  return {
    isOpen,
    show,
    confirmData,
  };
}

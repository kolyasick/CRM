<script setup lang="ts">
import type { BankAccount } from "@prisma/client";

const props = defineProps<{
  bankForm: Omit<BankAccount, "id">;
  showBankModal: boolean;
}>();

const emit = defineEmits<{
  (e: "update:showBankModal", value: boolean): void;
  (e: "saveBankDetails"): void;
}>();

const bankFormErrors = ref({
  bik: "",
  title: "",
  accountNumber: "",
  cAccount: "",
});

watch(
  () => props.bankForm.bik,
  async (newBik, oldBik) => {
    if (newBik?.length === 9 && newBik !== oldBik) {
      await findBankCredentials(newBik);
    }
  }
);

watch(
  () => props.bankForm.bik,
  () => {
    if (bankFormErrors.value.bik) {
      bankFormErrors.value.bik = "";
    }
  }
);

watch(
  () => props.bankForm.title,
  () => {
    if (bankFormErrors.value.title) {
      bankFormErrors.value.title = "";
    }
  }
);

watch(
  () => props.bankForm.accountNumber,
  () => {
    if (bankFormErrors.value.accountNumber) {
      bankFormErrors.value.accountNumber = "";
    }
  }
);

watch(
  () => props.bankForm.cAccount,
  () => {
    if (bankFormErrors.value.cAccount) {
      bankFormErrors.value.cAccount = "";
    }
  }
);

const validateBankForm = () => {
  bankFormErrors.value = {
    bik: "",
    title: "",
    accountNumber: "",
    cAccount: "",
  };

  let isValid = true;

  if (!String(props.bankForm.bik || "").trim()) {
    bankFormErrors.value.bik = "Введите БИК банка";
    isValid = false;
  } else if ((props.bankForm.bik || "").length !== 9) {
    bankFormErrors.value.bik = "БИК должен содержать 9 цифр";
    isValid = false;
  }

  if (!String(props.bankForm.title).trim()) {
    bankFormErrors.value.title = "Введите название банка";
    isValid = false;
  }

  if (!String(props.bankForm.accountNumber || "").trim()) {
    bankFormErrors.value.accountNumber = "Введите номер расчетного счета";
    isValid = false;
  } else if ((props.bankForm.accountNumber || "").length !== 20) {
    bankFormErrors.value.accountNumber = "Номер счета должен содержать 20 цифр";
    isValid = false;
  }

  if (!String(props.bankForm.cAccount || "").trim()) {
    bankFormErrors.value.cAccount = "Введите корреспондентский счет";
    isValid = false;
  } else if ((props.bankForm.cAccount || "").length !== 20) {
    bankFormErrors.value.cAccount = "Кор. счет должен содержать 20 цифр";
    isValid = false;
  }

  return isValid;
};

const handleSaveBankDetails = () => {
  if (!validateBankForm()) {
    return;
  }
  emit("saveBankDetails");
};

const findBankCredentials = async (bik: string) => {
  try {
    const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank";
    const token = "cff3eb06a96c63b2824c2d9267e29d4948f3c8e9";

    const options: RequestInit = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token " + token,
      },
      body: JSON.stringify({ query: bik }),
    };

    const res = await fetch(url, options);
    const data = await res.json();

    if (data) {
      props.bankForm.title = data.suggestions[0].value;
      props.bankForm.address = data.suggestions[0].data.address.unrestricted_value;
      props.bankForm.cAccount = data.suggestions[0].data.correspondent_account;
      props.bankForm.city = data.suggestions[0].data.payment_city;
    }
  } catch (error) {
    console.log(error);
  }
};
</script>

<template>
  <div v-if="showBankModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Банковские реквизиты</h2>
        <button @click="emit('update:showBankModal', false)" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSaveBankDetails" class="space-y-3">
        <UiInput title="БИК" v-model="bankForm.bik" required :regex="/[^\d]/g" :error="bankFormErrors.bik" />
        <UiInput title="Название банка" v-model="bankForm.title" required :error="bankFormErrors.title" />
        <UiInput title="Номер счета" v-model="bankForm.accountNumber" :regex="/[^\d]/g" required :error="bankFormErrors.accountNumber" />
        <UiInput title="Кор. счет" v-model="bankForm.cAccount" :regex="/[^\d]/g" required :error="bankFormErrors.cAccount" />

        <div class="grid grid-cols-2 gap-4">
          <UiInput title="Город" v-model="bankForm.city" />
          <UiInput title="Адрес" v-model="bankForm.address" />
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="emit('update:showBankModal', false)"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

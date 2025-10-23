<script setup lang="ts">
import type { Legal_entity, BankAccount } from "@prisma/client";

type ILegalEntity = Legal_entity & {
  bankAccount?: BankAccount | null;
};

type LegalEntityForm = Omit<ILegalEntity, "id" | "bankAccount" | "tax" | "dbName"> & {
  bankAccount: Omit<BankAccount, "id"> | null;
};

const props = defineProps<{
  modelValue: boolean;
  entity: ILegalEntity | null;
  isLoading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", entity: LegalEntityForm): Promise<void>;
}>();

const form = ref<LegalEntityForm>({
  title: "",
  form: "",
  inn: "",
  kpp: "",
  ogrn: "",
  physicalAddress: "",
  legalAddress: null as string | null,
  isPhysicalAddressEq: true,
  mailAddress: "",
  isMailAddressEq: true,
  phone: "",
  email: "",
  bankAccountId: null as number | null,
  bankAccount: null as Omit<BankAccount, "id"> | null,
});

const showBankModal = ref(false);
const bankForm = ref({
  title: "",
  bik: "",
  accountNumber: "",
  cAccount: "",
  address: "",
  city: "",
});

watch(
  () => props.entity,
  (newEntity) => {
    if (newEntity) {
      const { bankAccount, ...rest } = newEntity;
      form.value = {
        ...rest,
        bankAccount: bankAccount
          ? {
              title: bankAccount.title,
              bik: bankAccount.bik || "",
              accountNumber: bankAccount.accountNumber || "",
              cAccount: bankAccount.cAccount || "",
              address: bankAccount.address || "",
              city: bankAccount.city || "",
            }
          : null,
      };
    } else {
      form.value = {
        title: "",
        form: "",
        inn: "",
        kpp: "",
        ogrn: "",
        physicalAddress: "",
        legalAddress: null,
        isPhysicalAddressEq: true,
        mailAddress: "",
        isMailAddressEq: true,
        phone: "",
        email: "",
        bankAccountId: null,
        bankAccount: null,
      };
    }
  },
  { immediate: true }
);

const openBankModal = () => {
  if (props.entity?.bankAccount) {
    bankForm.value = {
      title: props.entity.bankAccount.title,
      bik: props.entity.bankAccount.bik || "",
      accountNumber: props.entity.bankAccount.accountNumber || "",
      address: props.entity.bankAccount.address || "",
      cAccount: props.entity.bankAccount.cAccount || "",
      city: props.entity.bankAccount.city || "",
    };
  }
  showBankModal.value = true;
};

const saveBankDetails = () => {
  form.value.bankAccount = { ...bankForm.value };
  showBankModal.value = false;
};

const handleSubmit = () => {
  if (props.entity) {
    emit("save", { ...props.entity, ...form.value });
  } else {
    emit("save", form.value);
  }
};
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black z-50 bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ entity ? "Редактирование" : "Добавление" }} юридического лица</h2>
        <button @click="$emit('update:modelValue', false)" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div v-if="error" class="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 dark:text-red-200">{{ error }}</p>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UiInput title="Название" v-model="form.title" required />
          <UiDropdown title="Форма" v-model="form.form" required>
            <option value="">Выберите форму</option>
            <option value="Юр. лицо">Юр. лицо</option>
            <option value="ИП">ИП</option>
            <option value="Физ. лицо">Физ. лицо</option>
            <option value="Самозанятый">Самозанятый</option>
            <option value="Обособленное подразделение">Обособленное подразделение</option>
            <option value="Гос. орган">Гос. орган</option>
          </UiDropdown>
          <UiInput title="ИНН" v-model="form.inn" required :regex="/[^\d]/g" />
          <UiInput title="КПП" v-model="form.kpp" required :regex="/[^\d]/g" />
          <UiInput title="ОГРН" v-model="form.ogrn" required :regex="/[^\d]/g" />
          <UiInput title="Телефон" v-model="form.phone" required />
          <UiInput title="Email" type="email" v-model="form.email" required />
        </div>

        <div class="space-y-3">
          <UiInput title="Фактический адрес" v-model="form.physicalAddress" required />
          <UiInput v-if="!form.isPhysicalAddressEq" title="Юридический адрес" v-model="form.legalAddress" required />
          <UiInput v-if="!form.isMailAddressEq" title="Почтовый адрес" v-model="form.mailAddress" required />

          <div class="col-span-2 space-y-2">
            <div class="flex items-center space-x-2">
              <input v-model="form.isPhysicalAddressEq" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Физический адрес совпадает с юридическим</label>
            </div>

            <div class="flex items-center space-x-2">
              <input v-model="form.isMailAddressEq" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Почтовый адрес совпадает с юридическим</label>
            </div>
          </div>
        </div>

        <BankDetailsSection :bankAccount="form.bankAccount" @open-bank-modal="openBankModal" />

        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="$emit('update:modelValue', false)"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Отмена
          </button>
          <button
            :disabled="isLoading"
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none"
          >
            <IconsLoader v-if="isLoading" class="w-5 h-5 animate-spin" />
            <span v-else>{{ entity ? "Сохранить" : "Добавить" }}</span>
          </button>
        </div>
      </form>
    </div>

    <BankDetailsForm :bankForm="bankForm" v-model:show-bank-modal="showBankModal" @saveBankDetails="saveBankDetails" />
  </div>
</template>

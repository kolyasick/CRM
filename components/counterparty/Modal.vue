<script setup lang="ts">
import type { Counterparty, Counterparty_contact, Project, Legal_entity, BankAccount } from "@prisma/client";

const { user } = useUserSession();
type ICounterparty = Counterparty & {
  counterparty_contact?: Counterparty_contact[];
  project?: Project[];
  legalEntity?: Legal_entity;
  bankAccount?: BankAccount;
};

type CounterPartyBody = {
  id?: string;
  title: string;
  comment: string | null;
  lawyerComment: string | null;
  legalEntityId: number;
  form: string;
  inn: string;
  kpp: string;
  ogrn: string;
  physicalAddress: string;
  isPhysicalAddressEq: boolean;
  legalAddress: string;
  mailAddress: string;
  isMailAddressEq: boolean;
  phone: string;
  email: string;
  isContractor: boolean;
  bankAccountId: number | null;
  bankAccount: {
    title: string;
    bik: string;
    accountNumber: string;
    cAccount: string;
    address: string;
    city: string;
  } | null;
  contacts: Counterparty_contact[];
  new_contacts: Omit<Counterparty_contact, "id">[];
  removed_contact_ids: number[];
};

const props = defineProps<{
  counterparty: ICounterparty | null;
  isLoading: boolean;
  error: string | null;
  legalEntities: Legal_entity[];
}>();

const emit = defineEmits<{
  (e: "handleToggleModal", value: boolean): void;
  (e: "save", counterparty: CounterPartyBody | Omit<CounterPartyBody, "id">): Promise<void>;
}>();

const form = ref<CounterPartyBody>({
  title: "",
  comment: null,
  lawyerComment: null,
  legalEntityId: 0,
  form: "",
  inn: "",
  kpp: "",
  ogrn: "",
  physicalAddress: "",
  legalAddress: "",
  isPhysicalAddressEq: true,
  mailAddress: "",
  isMailAddressEq: true,
  phone: "",
  email: "",
  isContractor: false,
  bankAccountId: null,
  bankAccount: null,
  contacts: [],
  new_contacts: [],
  removed_contact_ids: [],
});

const formErrors = ref<Record<string, string>>({});

const newContact = ref("");
const newContactName = ref("");
const newContactPosition = ref("");
const contactLoading = ref(false);
const removingContactIndex = ref<number | null>(null);

const showBankModal = ref(false);
const bankForm = ref({
  title: "",
  bik: "",
  accountNumber: "",
  cAccount: "",
  city: "",
  address: "",
});

watch(
  () => props.counterparty,
  (newCounterparty) => {
    formErrors.value = {};

    if (newCounterparty) {
      form.value = {
        id: newCounterparty.id,
        title: newCounterparty.title,
        comment: newCounterparty.comment,
        lawyerComment: newCounterparty.lawyerComment,
        legalEntityId: newCounterparty.legalEntityId,
        form: newCounterparty.form,
        inn: newCounterparty.inn,
        kpp: newCounterparty.kpp,
        ogrn: newCounterparty.ogrn,
        physicalAddress: newCounterparty.physicalAddress,
        legalAddress: newCounterparty.legalAddress || "",
        isPhysicalAddressEq: newCounterparty.isPhysicalAddressEq,
        mailAddress: newCounterparty.mailAddress,
        isMailAddressEq: newCounterparty.isMailAddressEq,
        phone: newCounterparty.phone,
        email: newCounterparty.email,
        isContractor: newCounterparty.isContractor,
        bankAccountId: newCounterparty.bankAccountId,
        // @ts-ignore
        bankAccount: newCounterparty.bankAccount || {
          title: "",
          bik: "",
          accountNumber: "",
          address: "",
          cAccount: "",
          city: "",
        },
        contacts: newCounterparty.counterparty_contact || [],
        new_contacts: [],
        removed_contact_ids: [],
      };
    } else {
      form.value = {
        title: "",
        comment: "",
        lawyerComment: "",
        legalEntityId: 0,
        form: "",
        inn: "",
        kpp: "",
        ogrn: "",
        physicalAddress: "",
        isPhysicalAddressEq: true,
        legalAddress: "",
        mailAddress: "",
        isMailAddressEq: true,
        phone: "",
        email: "",
        isContractor: false,
        bankAccountId: 0,
        bankAccount: {
          title: "",
          bik: "",
          accountNumber: "",
          address: "",
          cAccount: "",
          city: "",
        },
        contacts: [],
        new_contacts: [],
        removed_contact_ids: [],
      };
    }
  },
  { immediate: true }
);

const addContact = async () => {
  if (!newContact.value.trim() || contactLoading.value || !newContactName.value.trim() || !newContactPosition.value.trim()) return;

  try {
    contactLoading.value = true;
    form.value.new_contacts.push({
      title: newContactName.value,
      position: newContactPosition.value,
      contact: newContact.value,
      counterparty_id: props.counterparty?.id || "",
    });
    newContact.value = "";
    newContactName.value = "";
    newContactPosition.value = "";
  } finally {
    contactLoading.value = false;
  }
};

const removeContact = async (index: number) => {
  if (removingContactIndex.value === index) return;

  try {
    removingContactIndex.value = index;
    const contact = form.value.contacts[index];
    if (contact.id) {
      form.value.removed_contact_ids.push(contact.id);
    }
    form.value.contacts.splice(index, 1);
  } finally {
    removingContactIndex.value = null;
  }
};

const openBankModal = () => {
  if (props.counterparty?.bankAccount) {
    bankForm.value = {
      title: props.counterparty.bankAccount.title,
      bik: props.counterparty.bankAccount.bik || "",
      accountNumber: props.counterparty.bankAccount?.accountNumber || "",
      cAccount: props.counterparty.bankAccount?.cAccount || "",
      address: props.counterparty.bankAccount?.address || "",
      city: props.counterparty.bankAccount?.city || "",
    };
  }
  showBankModal.value = true;
};

const saveBankDetails = () => {
  form.value.bankAccount = { ...bankForm.value };
  showBankModal.value = false;
};

const validateForm = () => {
  formErrors.value = {};
  let isValid = true;

  // Проверка ИНН
  if (!String(form.value.inn).trim()) {
    formErrors.value.inn = "Введите ИНН";
    isValid = false;
  } else if (form.value.inn.length < 10 || form.value.inn.length > 12) {
    formErrors.value.inn = "ИНН должен содержать 10 или 12 цифр";
    isValid = false;
  }

  if (!form.value.legalEntityId) {
    formErrors.value.legalEntityId = "Выберите юридическое лицо";
    isValid = false;
  }

  if (!form.value.form) {
    formErrors.value.form = "Выберите форму";
    isValid = false;
  }

  if (!form.value.title.trim()) {
    formErrors.value.title = "Введите название";
    isValid = false;
  }

  if (form.value.bankAccount?.title) {
    if (!String(form.value.bankAccount?.bik).trim()) {
      formErrors.value.bankAccount = "Введите БИК банка";
      isValid = false;
    } else if (form.value.bankAccount.bik.length !== 9) {
      formErrors.value.bankAccount = "БИК должен содержать 9 цифр";
      isValid = false;
    } else if (!String(form.value.bankAccount?.accountNumber).trim()) {
      formErrors.value.bankAccount = "Введите номер расчетного счета";
      isValid = false;
    } else if (form.value.bankAccount.accountNumber.length !== 20) {
      formErrors.value.bankAccount = "Номер счета должен содержать 20 цифр";
      isValid = false;
    }
  }

  return isValid;
};

const handleSubmit = () => {
  if (!validateForm()) {
    return;
  }
  emit("save", form.value);
};

watch(
  () => form.value.inn,
  async (newInn, oldInn) => {
    if (newInn.length > 8 && newInn !== oldInn) {
      await findBankCredentials(newInn);
    }
  }
);

watch(
  () => form.value.title,
  () => {
    if (formErrors.value.title) {
      formErrors.value.title = "";
    }
  }
);

watch(
  () => form.value.legalEntityId,
  () => {
    if (formErrors.value.legalEntityId) {
      formErrors.value.legalEntityId = "";
    }
  }
);

watch(
  () => form.value.form,
  () => {
    if (formErrors.value.form) {
      formErrors.value.form = "";
    }
  }
);

watch(
  () => form.value.inn,
  () => {
    if (formErrors.value.inn) {
      formErrors.value.inn = "";
    }
  }
);

watch(
  () => form.value.bankAccount,
  () => {
    if (formErrors.value.bankAccount) {
      formErrors.value.bankAccount = "";
    }
  }
);

const findBankCredentials = async (inn: string) => {
  try {
    const url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party";
    const token = "cff3eb06a96c63b2824c2d9267e29d4948f3c8e9";

    const options: RequestInit = {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Token " + token,
      },
      body: JSON.stringify({ query: inn }),
    };

    const res = await fetch(url, options);
    const data = await res.json();

    if (data && data.suggestions.length) {
      form.value = {
        ...form.value,
        title: data.suggestions[0].value,
        form: data.suggestions[0].data.type === "LEGAL" ? "Юр. лицо" : data.suggestions[0].data.type === "INDIVIDUAL" ? "ИП" : "",
        physicalAddress: data.suggestions[0].data.address.unrestricted_value,
        kpp: data.suggestions[0].data.kpp,
        ogrn: data.suggestions[0].data.ogrn,
      };
    }
  } catch (error) {
    console.log(error);
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6 my-8 max-h-[700px] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">{{ counterparty ? "Редактирование" : "Добавление" }} контрагента</h2>
        <button @click="$emit('handleToggleModal', false)" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div v-if="!counterparty || !counterparty.isAgreed">
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiInput title="ИНН" required v-model="form.inn" :is-number="true" :error="formErrors.inn" :regex="/[^\d]/g" />

            <UiDropdown title="Юридическое лицо" required v-model="form.legalEntityId" :error="formErrors.legalEntityId">
              <option value="0">Выберите юридическое лицо</option>
              <option v-for="entity in legalEntities" :key="entity.id" :value="entity.id">
                {{ entity.title }}
              </option>
            </UiDropdown>

            <UiDropdown :error="formErrors.form" title="Форма" required v-model="form.form">
              <option value="">Выберите форму</option>
              <option value="Юр. лицо">Юр. лицо</option>
              <option value="ИП">ИП</option>
              <option value="Физ. лицо">Физ. лицо</option>
              <option value="Самозанятый">Самозанятый</option>
              <option value="Обособленное подразделение">Обособленное подразделение</option>
              <option value="Гос. орган">Гос. орган</option>
            </UiDropdown>

            <UiInput title="Название" required v-model="form.title" :error="formErrors.title" />
            <UiInput title="КПП" v-model="form.kpp" :regex="/[^\d]/g" />
            <UiInput title="ОГРН" v-model="form.ogrn" :regex="/[^\d]/g" />
            <UiInput title="Физический адрес" v-model="form.physicalAddress" />
            <UiInput v-if="!form.isPhysicalAddressEq" title="Юридический адрес" v-model="form.legalAddress" />
            <UiInput v-if="!form.isMailAddressEq" title="Почтовый адрес" v-model="form.mailAddress" />

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
            <UiInput type="tel" title="Телефон" v-model="form.phone" />
            <UiInput type="email" title="Email" v-model="form.email" />
          </div>

          <div class="grid gap-4 my-2" :class="{ 'grid-cols-2': user?.role === 'LAWYER' || user?.role === 'ADMIN' }">
            <UiInput title="Комментарий" v-model="form.comment" />
            <UiInput v-if="user?.role === 'LAWYER' || user?.role === 'ADMIN'" title="Комментарий для юристов" v-model="form.lawyerComment" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Контакты</label>
            <div class="space-y-2">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(contact, index) in [...form.contacts, ...form.new_contacts]"
                  :key="index"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {{ contact.title }} ({{ contact.position }})
                  <button
                    type="button"
                    @click="removeContact(index)"
                    :disabled="removingContactIndex === index"
                    class="ml-1 inline-flex items-center p-0.5 rounded-full text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconsLoader v-if="removingContactIndex === index" class="h-3 w-3 animate-spin" />
                    <svg v-else class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              </div>
              <div class="flex gap-2">
                <div class="flex-1 grid grid-cols-3 gap-2">
                  <UiInput v-model="newContactName" :disabled="contactLoading" placeholder="Имя" />
                  <UiInput v-model="newContactPosition" :disabled="contactLoading" placeholder="Должность" />
                  <UiInput v-model="newContact" placeholder="Контакт" :disabled="contactLoading" />
                </div>
                <button
                  type="button"
                  @click="addContact"
                  :disabled="contactLoading || !newContact.trim() || !newContactName.trim() || !newContactPosition.trim()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconsLoader v-if="contactLoading" class="w-5 h-5 animate-spin" />
                  <span v-else>Добавить</span>
                </button>
              </div>
            </div>
          </div>

          <BankDetailsSection :bankAccount="form.bankAccount" @open-bank-modal="openBankModal" />

          <div v-if="formErrors.bankAccount" class="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
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
                <p class="text-sm text-red-700 dark:text-red-200">{{ formErrors.bankAccount }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <UiInput title="Комментарий" v-model="form.comment" />
          <UiInput v-if="user?.role === 'LAWYER' || user?.role === 'ADMIN'" title="Комментарий для юристов" v-model="form.lawyerComment" />
        </div>
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            :disabled="isLoading"
            @click="$emit('handleToggleModal', false)"
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
            <span v-else>{{ counterparty ? "Сохранить" : "Добавить" }}</span>
          </button>
        </div>
      </form>
    </div>

    <BankDetailsForm :bankForm="bankForm" v-model:show-bank-modal="showBankModal" @saveBankDetails="saveBankDetails" />
  </div>
</template>

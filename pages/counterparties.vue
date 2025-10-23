<script setup lang="ts">
import { IconsSearch } from "#components";
import type { Counterparty, Counterparty_contact, Project, Legal_entity } from "@prisma/client";
import type { CounterParty } from "~/types/project";

const { addNotification } = useNotification();
const { show } = useConfirmModal();
const { user } = useUserSession();
const store = useGeneralStore();
const config = useRuntimeConfig();

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
  mailAddress: string;
  isMailAddressEq: boolean;
  phone: string;
  email: string;
  isContractor: boolean;
  contacts: Counterparty_contact[];
  new_contacts: Omit<Counterparty_contact, "id">[];
  removed_contact_ids: number[];
  project?: Project[];
};
const showModal = ref(false);

const toggleModal = (val: boolean) => {
  showModal.value = val;
  store.switchBody(val);
};

const isCModalOpen = useCookie<boolean>("isCModalOpen");

if (isCModalOpen.value == true) {
  toggleModal(true);

  setTimeout(() => {
    isCModalOpen.value = false;
  }, 500);
}

const limit = ref(10);
const offset = ref(0);
const trigger = ref<HTMLDivElement | undefined>();

const isLoading = ref(false);
const isSaveLoading = ref(false);
const hasMore = ref(true);
const error = ref();

const route = useRoute();

const counterparties = ref<CounterParty[]>([]);
const searchQuery = useDebounceRef("", 300);
const selectedStatus = ref("");
const statuses = ref(["Согласованные", "Не согласованные"]);

const loadCounterparties = async () => {
  if (isLoading.value || !hasMore.value) return;

  isLoading.value = true;
  try {
    const data = await $fetch<CounterParty[]>("/api/counterparty/search", {
      query: {
        q: searchQuery.value,
        isAgreed: selectedStatus.value ? (selectedStatus.value === "Не согласованные" ? 0 : 1) : undefined,
        limit: limit.value,
        offset: offset.value,
        projects: true,
        id: route.query.id,
      },
    });

    const chunk = data || [];
    if (chunk.length > 0) {
      counterparties.value = [...counterparties.value, ...chunk];
      offset.value += chunk.length;
      hasMore.value = chunk.length === limit.value;
    } else {
      hasMore.value = false;
    }
  } catch (e) {
    error.value = e;
    console.error("Ошибка при загрузке контрагентов:", e);
  } finally {
    isLoading.value = false;
  }
};

await loadCounterparties();

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (trigger.value) {
    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadCounterparties();
        }
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      }
    );

    observer.observe(trigger.value);
  }
});

onUnmounted(() => {
  if (observer && trigger.value) {
    observer.unobserve(trigger.value);
    observer.disconnect();
  }
});

const actionError = ref<string | null>(null);

const editingCounterparty = ref<Counterparty | null>(null);

watch([searchQuery, selectedStatus], async () => {
  offset.value = 0;
  hasMore.value = true;
  counterparties.value = [];
  error.value = null;

  isLoading.value = true;
  try {
    const data = await $fetch<CounterParty[]>("/api/counterparty/search", {
      query: {
        q: searchQuery.value,
        isAgreed: selectedStatus.value ? (selectedStatus.value === "Не согласованные" ? 0 : 1) : undefined,
        limit: limit.value,
        offset: offset.value,
        projects: true,
      },
    });

    const chunk = data || [];
    counterparties.value = chunk;
    offset.value += chunk.length;
    hasMore.value = chunk.length === limit.value;
  } catch (e) {
    console.error(e);
    error.value = e;
  } finally {
    isLoading.value = false;
  }
});

const openAddModal = () => {
  editingCounterparty.value = null;
  toggleModal(true);
};

const openEditModal = (counterparty: CounterParty) => {
  editingCounterparty.value = counterparty;
  toggleModal(true);
};

const handleSave = async (counterparty: CounterPartyBody | Omit<CounterPartyBody, "id">) => {
  try {
    isSaveLoading.value = true;
    actionError.value = null;

    delete counterparty.project;

    if ("id" in counterparty) {
      const response = await $fetch<CounterParty>(`/api/counterparty/${counterparty.id}`, {
        method: "PUT",
        body: counterparty,
      });

      counterparties.value = counterparties.value?.map((c) => (c.id === counterparty.id ? { ...c, ...response } : c)) || [];
      addNotification(`Контрагент "${counterparty.title}" обновлен`, "success");
    } else {
      const response = await $fetch<CounterParty>("/api/counterparty", {
        method: "POST",
        body: counterparty,
      });

      const mailOptions = {
        from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
        to: store.LAWYER_EMAILS.join(", "),
        subject: `📋 Новый контрагент для согласования: "${counterparty.title}"`,
        text: `📋 Добавлен новый контрагент "${
          counterparty.title
        }", необходимо согласовать\n\n🔗 Ссылки:\n   • Для удаленного рабочего стола: http://localhost:1823/counterparties?id=${
          response.id
        }\n   • Обычная ссылка: ${config.public.APP_URL}/counterparties?id=${response.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #e67e22; margin: 0; padding: 10px 0; border-bottom: 2px solid #e67e22;">
                📋 Требуется согласование контрагента
              </h1>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 18px; color: #856404; margin: 0 0 15px 0;">
                <strong>Добавлен новый контрагент, требующий вашего согласования</strong>
              </p>
              <div style="background: white; padding: 15px; border-radius: 6px; display: inline-block;">
                <p style="font-size: 20px; color: #e67e22; margin: 0; font-weight: bold;">
                  "${counterparty.title}"
                </p>
              </div>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0; text-align: center;">🔗 Перейти к согласованию</h3>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e67e22;">
                <p style="margin: 12px 0; font-weight: bold; color: #495057;">
                  🖥️ Для удаленного рабочего стола:
                </p>
                <p style="margin: 8px 0;">
                  <a href="http://localhost:1823/counterparties?id=${response.id}" 
                    style="color: #e67e22; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #fdf6e3; border-radius: 4px; border: 1px solid #ffeaa7;">
                    http://localhost:1823/counterparties?id=${response.id}
                  </a>
                </p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e67e22;">
                <p style="margin: 12px 0; font-weight: bold; color: #495057;">
                  🌐 Обычная ссылка:
                </p>
                <p style="margin: 8px 0;">
                  <a href="${config.public.APP_URL}/counterparties?id=${response.id}" 
                    style="color: #e67e22; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #fdf6e3; border-radius: 4px; border: 1px solid #ffeaa7;">
      ${config.public.APP_URL}/counterparties?id=${response.id}
                  </a>
                </p>
              </div>
            </div>

            <div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <p style="color: #721c24; margin: 0; font-weight: bold;">
                ⚠️ Требуется ваше внимание: необходимо согласовать контрагента в кратчайшие сроки
              </p>
            </div>
          </div>`,
      };

      await $fetch("/api/mailer/send-mail", {
        method: "POST",
        body: { mailOptions },
      });

      if (counterparties.value) {
        counterparties.value.push(response);
        addNotification(`Контрагент "${response.title}" добавлен`, "success");
      } else {
        counterparties.value = [response];
      }
    }
    toggleModal(false);
    editingCounterparty.value = null;
  } catch (error: any) {
    actionError.value = error.data.message;
  } finally {
    isSaveLoading.value = false;
  }
};

const confirmDelete = async (counterparty: CounterParty) => {
  show({
    message: `Вы уверены, что хотите удалить "${counterparty.title}"?`,
    async onConfirm() {
      try {
        isLoading.value = true;
        actionError.value = null;

        await $fetch(`/api/counterparty/${counterparty.id}`, {
          method: "DELETE",
        });
        counterparties.value = counterparties.value?.filter((c) => c.id !== counterparty.id) || [];
        addNotification(`Контрагент "${counterparty.title}" удален`, "success");
      } catch (error: any) {
        addNotification(`Что-то пошло не так`, "error");
        actionError.value = error.data.message;
      } finally {
        isLoading.value = false;
      }
    },
  });
};

useHead({
  title: "MCRM | Контрагенты",
  meta: [{ name: "description", content: "MCRM |Управление контрагентами" }],
});
</script>

<template>
  <NuxtLayout name="page-layout">
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <SharedPageTitle title="Контрагенты" subtitle="Управление контрагентами" />
        <UiButton v-if="user" @click="openAddModal"> Добавить контрагента </UiButton>
      </div>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 grid grid-cols-2 items-center gap-6">
        <UiInput placeholder="Поиск по названию, ИНН, проекту, комментарию" v-model="searchQuery" :icon="IconsSearch" />
        <UiDropdown v-model="selectedStatus">
          <option value="">Статус согласования</option>
          <option v-for="status in statuses" :key="status" :value="status">
            {{ status }}
          </option>
        </UiDropdown>
      </div>
      <div v-if="error" class="p-6 text-red-500">Ошибка загрузки данных: {{ error.message }}</div>
      <CounterpartyList
        v-if="counterparties"
        :counterparties="counterparties"
        :is-loading="isLoading"
        @open-edit-modal="openEditModal"
        @confirm-delete="confirmDelete"
      />
      <IconsLoader class="w-20 h-20 animate-spin text-white mx-auto" v-if="isLoading" />
      <div class="h-2" ref="trigger"></div>
    </div>

    <Transition name="fade">
      <CounterpartyModal
        v-if="showModal"
        class="animate"
        :counterparty="editingCounterparty"
        :is-loading="isSaveLoading"
        :error="actionError"
        :legal-entities="store.entities || []"
        @save="handleSave"
        @handle-toggle-modal="toggleModal"
      />
    </Transition>
  </NuxtLayout>
</template>

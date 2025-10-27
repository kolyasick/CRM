<script setup lang="ts">
import type { CounterParty } from "~/types/project";

const props = defineProps<{
  counterparty: CounterParty;
}>();

const emit = defineEmits<{
  (e: "openEditModal", counterparty: CounterParty): void;
  (e: "confirmDelete", counterparty: CounterParty): void;
  (e: "approve", counterparty: CounterParty): void;
}>();

const { user } = useUserSession();
const { addNotification } = useNotification();
const { show } = useConfirmModal();
const config = useRuntimeConfig();
const route = useRoute();

const canApprove = computed(() => {
  return user.value?.role === "LAWYER" || user.value?.role === "ADMIN";
});

const handleApprove = async (counterparty: CounterParty) => {
  show({
    title: "Согласование контрагента",
    message: `Вы уверены, что хотите согласовать контрагента "${counterparty.title}"?`,
    onConfirm: async () => {
      try {
        // await fetch(`${config.public.API_URL}/${counterparty.legalEntity?.dbName}/hs/hapi/v1/counteragent`, {
        //   method: "POST",
        //   body: JSON.stringify({
        //     Name: counterparty.title,
        //     FullName: counterparty.title,
        //     INN: counterparty.inn || "",
        //     KPP: counterparty.kpp || "",
        //     PostAddress: counterparty.mailAddress || "",
        //     LegalAddress: counterparty.legalAddress || "",
        //     ActualAddress: counterparty.physicalAddress || "",
        //     Phone: counterparty.phone || "",
        //     Email: counterparty.email || "",
        //     Type: counterparty.form || "",
        //     MainBankAccount: {
        //       BankName: counterparty.bankAccount?.title || "",
        //       BIK: counterparty.bankAccount?.bik || "",
        //       CorrespondentAccount: counterparty.bankAccount?.cAccount || "",
        //       AccountNumber: counterparty.bankAccount?.accountNumber || "",
        //       Address: counterparty.bankAccount?.address || "",
        //       City: counterparty.bankAccount?.city || "",
        //       Currency: "RUB",
        //       MainAccount: true,
        //     },
        //     ContactPersons: counterparty.counterparty_contact?.map((c) => ({
        //       Name: c.title,
        //       Position: c.position,
        //       Phone: c.contact,
        //       Email: c.contact,
        //     })),
        //     Note: counterparty.comment || "",
        //   }),
        // });

        const response = await $fetch<CounterParty>(`/api/counterparty/${counterparty.id}/approve`, {
          method: "PUT",
        });

        const mailOptions = {
          from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
          to: counterparty.manager?.realEmail,
          subject: `✅ Согласован ваш контрагент "${counterparty.title}"`,
          text: `✅ Согласован ваш новый контрагент "${
            counterparty.title
          }"\n\n🔗 Ссылки:\n   • Для удаленного рабочего стола: http://localhost:1823/counterparties?id=${counterparty.id}\n   • Обычная ссылка: ${
            config.public.APP_URL
          }/counterparties?id=${counterparty.id}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #27ae60; margin: 0; padding: 10px 0; border-bottom: 2px solid #27ae60;">
                  ✅ Согласование контрагента
                </h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 18px; color: #2c3e50; margin: 0;">
                  Ваш контрагент <strong style="color: #27ae60;">"${counterparty.title}"</strong><br>
                  успешно согласован!
                </p>
              </div>

              <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2980b9; margin-top: 0; text-align: center;">🔗 Ссылка на контрагента</h3>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                    🖥️ Для удаленного рабочего стола:
                  </p>
                  <p style="margin: 8px 0;">
                    <a href="http://localhost:1823/counterparties?id=${counterparty.id}" 
                      style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
                      http://localhost:1823/counterparties?id=${counterparty.id}
                    </a>
                  </p>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                    🌐 Обычная ссылка:
                  </p>
                  <p style="margin: 8px 0;">
                    <a href="${config.public.APP_URL}/counterparties?id=${counterparty.id}" 
                      style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
        ${config.public.APP_URL}/counterparties?id=${counterparty.id}
                    </a>
                  </p>
                </div>
              </div>
            </div>`,
        };

        await $fetch("/api/mailer/send-mail", {
          method: "POST",
          body: { mailOptions },
        });

        counterparty.isAgreed = response.isAgreed;

        addNotification(`Контрагент "${counterparty.title}" согласован`, "success");
      } catch (error: any) {
        addNotification(`Что-то пошло не так`, "error");
        console.log(error);
      }
    },
  });
};

const expandedProjects = ref<Set<string>>(new Set());

const toggleProjectsExpansion = (counterpartyId: string) => {
  if (expandedProjects.value.has(counterpartyId)) {
    expandedProjects.value.delete(counterpartyId);
  } else {
    expandedProjects.value.add(counterpartyId);
  }
};

const getVisibleProjects = (counterparty: CounterParty) => {
  if (expandedProjects.value.has(counterparty.id) || !counterparty.project || counterparty.project.length <= 2) {
    return counterparty.project;
  }
  return counterparty.project.slice(0, 2);
};

const canManage = computed(() => {
  return (
    (route.path.includes("counterparties") || route.path.includes("contractor")) && (user.value?.role === "LAWYER" || user.value?.role === "ADMIN")
  );
});

const isAgreed = computed(() => {
  return "isAgreed" in props.counterparty ? props.counterparty.isAgreed : true;
});
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col"
    :class="{
      'border-2 border-red-500 dark:border-red-400': !isAgreed,
    }"
  >
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-start gap-2">
        <div class="flex items-start gap-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ counterparty.title }}</h3>
          <span
            v-if="!isAgreed"
            class="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
          >
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Не согласован
          </span>
        </div>
        <div v-if="canManage" class="flex space-x-2">
          <button
            v-if="canApprove && !isAgreed"
            @click="handleApprove(counterparty)"
            class="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Согласовать
          </button>

          <button @click="emit('openEditModal', counterparty)" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            v-if="!counterparty.isAgreed"
            @click="emit('confirmDelete', counterparty)"
            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="p-6 space-y-3 flex-grow">
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">ИНН</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.inn || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">КПП</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.kpp || "-" }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">ОГРН</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.ogrn || "-" }}</p>
          </div>
          <div v-if="'legalEntity' in counterparty">
            <p class="text-sm text-gray-500 dark:text-gray-400">Юр. лицо</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ counterparty.legalEntity?.title }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-3">
          <div class="space-y-2">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Физический адрес</p>
                <p class="text-xs font-medium text-gray-900 dark:text-white">
                  {{ counterparty.physicalAddress || "-" }}
                </p>
              </div>
            </div>
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Почтовый адрес</p>
                <p class="text-xs font-medium text-gray-900 dark:text-white">
                  {{ counterparty.mailAddress || "-" }}
                </p>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Телефон</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.phone || "-" }}</p>
              </div>
            </div>
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.email === "" ? "-" : counterparty.email }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="counterparty.bankAccount" class="space-y-2 overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 h-full">
            <div class="flex items-center space-x-2 mb-3">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Банковские реквизиты</p>
            </div>
            <div class="space-y-2">
              <div class="mb-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">Банк</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.bankAccount.title || "-" }}</p>
              </div>
              <div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">БИК</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.bankAccount.bik || "-" }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Счет</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ counterparty.bankAccount.accountNumber || "-" }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Кор. счет</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ counterparty.bankAccount.cAccount || "-" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="counterparty.counterparty_contact && counterparty.counterparty_contact.length > 0 && counterparty.counterparty_contact[0].title.trim()"
        class="space-y-2"
      >
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Контакты</p>
        <div class="space-y-2">
          <div v-for="contact in counterparty.counterparty_contact" :key="contact.id" class="flex items-start space-x-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1">
                <span class="text-sm text-gray-900 dark:text-white">{{ contact.title }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">({{ contact.position }})</span>
              </div>
              <div class="grid">
                <span v-for="c in contact.contact.split('\n')" class="text-sm text-gray-500 dark:text-gray-400">{{ c }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="counterparty.project && counterparty.project.length > 0" class="space-y-2">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Проекты</p>
        <div class="space-y-1">
          <NuxtLink
            v-for="project in getVisibleProjects(counterparty)"
            :key="project.id"
            :to="`/project/${project.id}`"
            class="block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {{ project.title }}
          </NuxtLink>
          <button
            v-if="counterparty.project.length > 2"
            @click="toggleProjectsExpansion(counterparty.id)"
            class="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {{ expandedProjects.has(counterparty.id) ? "Скрыть" : `Показать еще (${counterparty.project.length - 2})` }}
          </button>
        </div>
      </div>
    </div>

    <div class="grid border-t border-gray-200 dark:border-gray-700" :class="{ 'grid-cols-2': counterparty.lawyerComment }">
      <div class="p-6 bg-gray-50 dark:bg-gray-700/50">
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Комментарий</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ counterparty.comment || "-" }}</p>
        </div>
      </div>
      <div v-if="counterparty.lawyerComment" class="p-6 bg-gray-50 dark:bg-gray-700/50 border-l border-gray-200 dark:border-gray-700">
        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Комментарий юриста</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ counterparty.lawyerComment || "-" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

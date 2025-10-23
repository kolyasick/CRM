<script setup lang="ts">
import ConfirmModal from './components/shared/ConfirmModal.vue';
import Notification from './components/shared/Notification.vue';

const route = useRoute();
const store = useGeneralStore();
const entityStore = useEntityStore();

onMounted(async () => {
  await store.getEntities();
});

async function getCounterPartiesFromAllBases() {
  const BASES_TO_TRACK = [
    { apiName: "Berberova_IP", inn: "780160857210" },
    { apiName: "CRPI", inn: "7801341083" },
    { apiName: "Grand_30", inn: "7801461775" },
    { apiName: "Lite_buh", inn: "7801710661" },
    { apiName: "Magnat", inn: "7801081614" },
    { apiName: "MagnatProf_30", inn: "7801014939", id: 1 },
    { apiName: "Nekrasov_IP", inn: "780106318548" },
    { apiName: "Orange_30", inn: "7813461321" },
    { apiName: "RIA_STATUS", inn: "7813239133" },
    { apiName: "CRBI", inn: "7801743113" },
    // { apiName: "Orange_30_test", inn: "7813461321" },
  ];

  let totalCreated = 0;

  for (const { apiName, inn } of BASES_TO_TRACK) {
    try {
      console.log(`Запрашиваю данные из базы ${apiName}...`);

      const { data } = await useFetch(`/api/cc/${apiName}/hs/hapi/v1/counteragent`, {
        transform: (d: any) => {
          return d.map((c: any) => ({
            title: c.mainConteragentName,
            comment: c.comment,
            form: c.fizUr,
            inn: c.inn,
            kpp: c.kpp,
            ogrn: c.regNum,
            physicalAddress: c.contact["Фактический_адрес"] ?? "",
            legalAddress: c.contact["Юридический_адрес"] ?? null,
            isPhysicalAddressEq: c.contact["Юридический_адрес"] === c.contact["Фактический_адрес"],
            mailAddress: c.contact["Почтовый_адрес"] ?? "",
            isMailAddressEq: c.contact["Юридический_адрес"] === c.contact["Почтовый_адрес"],
            phone: c.contact["Телефон"] ?? "",
            email: c.contact["Email"] ?? "",
            isContractor: false,
            isAgreed: false,
            banckAccount: {
              title: c.bank_account.name,
              bik: c.bank_account.bik,
              accountNumber: c.bank_account.account,
              cAccount: c.bank_account.c_account,
              address: c.bank_account.address,
              city: c.bank_account.city,
            },
            counterparty_contact: {
              title: `${c.contact_person.last_name} ${c.contact_person.first_name} ${c.contact_person.third_name}`,
              position: c.contact_person.position,
              contact: `${c.contact_person.contact["Телефон_мобильный"] ?? ""}\n${c.contact_person.contact["Email"] ?? ""}`,
            },
          }));
        },
      });

      if (data.value) {
        await $fetch("/api/counterparty/createAll", {
          method: "POST",
          body: {
            data: data.value,
            inn: inn,
          },
        });
      }
    } catch (error) {
      console.error(`Ошибка при обработке базы ${apiName}:`, error);
    }
  }

  console.log(`Всего создано ${totalCreated} записей контрагентов из всех баз`);
}

onMounted(() => {
  // @ts-ignore
  window.getCP = getCounterPartiesFromAllBases;
});
const isAuthPage = computed(() => {
  return ["/login", "/register", "/forgot-password"].includes(route.path);
});

const isDark = useCookie<boolean>("crm-darkMode");

if (import.meta.client) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (isDark.value === undefined) {
    isDark.value = prefersDark;
  }
}

useHead({
  bodyAttrs: {
    class: computed(() => (isDark.value ? "dark" : "")),
  },
});

</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <Notification />
    <ConfirmModal />
    <Transition name="fade">
      <ProjectEntityInfoModal
        v-if="entityStore.showEntityModal"
        v-model="entityStore.showEntityModal"
        :entityId="entityStore.selectedEntity"
        :type="entityStore.selectedEntityType"
      />
    </Transition>

    <div v-if="!isAuthPage" class="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <main class="flex-1" :class="{ 'lg:ml-64': route.path !== '/projects', 'lg:ml-16': route.path === '/projects' }">
        <NuxtPage />
      </main>
    </div>
    <main v-else class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

body {
  font-family: "Montserrat", "sans-serif";
}

* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter,
    backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

button {
  text-wrap: nowrap;

  &:disabled {
    pointer-events: none;
  }
}
</style>

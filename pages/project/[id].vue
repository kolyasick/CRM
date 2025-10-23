<script setup lang="ts">
import { IconsSearch } from "#components";
import type { Closed_doc_status, Application, Job } from "@prisma/client";
import type { IApplication, IJob, IProject } from "~/types/project";

const route = useRoute();
const { addNotification } = useNotification();
const { show } = useConfirmModal();
const { user } = useUserSession();
const store = useGeneralStore();

const isLoading = ref(false);
const isAppLoading = ref(true);
const isJobLoading = ref(true);
const actionError = ref<string | null>(null);
const jobError = ref<string | null>(null);

const isSumEditing = ref(false);

const showApplicationModal = ref(false);
const isJobModalOpen = ref(false);
const isIncome = ref(false);

const editingApplication = ref<Application | null>(null);

const searchQuery = ref("");
const jobSearch = ref("");
const showPrecedentModal = ref(false);

const { data: project } = await useFetch<IProject>(`/api/project/${route.params.id}`);
if (!project.value) {
  throw createError({
    statusCode: 404,
    message: "Проект не найден",
    fatal: true,
  });
}

const { data: closedDocStatuses } = await useFetch<Closed_doc_status[]>("/api/closed-doc-status");
const applications = ref<IApplication[]>([]);
const jobs = ref<Job[]>([]);

const isReaded = ref(project.value?.is_readed || false);
const isCorrection = ref(project.value?.isCorrection || false);

const editedSum = ref(project.value.sum);
const isDropdownOpen = ref(false);
const isSearchModalOpen = ref(false);
const isEditModalOpen = ref(false);

const handleToggleJobModal = (val: boolean) => {
  store.switchBody(val);
  isJobModalOpen.value = val;
};

onMounted(async () => {
  try {
    if (!project.value?.applications) {
      isAppLoading.value = false;
      return;
    }

    isAppLoading.value = true;
    const appsRes = await $fetch<IApplication[]>("/api/application", {
      query: {
        projectId: route.params.id,
      },
    });

    applications.value = appsRes;
  } catch (error) {
    console.log(error);
  } finally {
    isAppLoading.value = false;
  }
});

onMounted(async () => {
  try {
    isJobLoading.value = true;
    const jobsRes = await $fetch<Job[]>("/api/job/findAll", {
      query: {
        projectId: project.value?.id,
      },
    });

    jobs.value = jobsRes;
  } catch (error) {
    console.log(error);
  } finally {
    isJobLoading.value = false;
  }
});

watch(
  () => project.value?.is_readed,
  (newValue) => {
    isReaded.value = newValue || false;
  }
);

const openAddPrecedentModal = () => {
  showPrecedentModal.value = true;
};

const toggleApplicationModal = (val: boolean) => {
  editingApplication.value = null;
  showApplicationModal.value = val;
  store.switchBody(val);
};

const toggleApplicationSearchModal = (val: boolean) => {
  isSearchModalOpen.value = val;
  store.switchBody(val);
};

const toggleProjectModal = (val: boolean) => {
  isEditModalOpen.value = val;
  store.switchBody(val);
};

const handleSaveApplication = async (applicationData: Omit<IApplication, "id">) => {
  try {
    isLoading.value = true;
    actionError.value = null;

    const application = await store.saveApplication(applicationData);
    if (!application) return;

    if ("id" in applicationData) {
      const applicationIndex = applications.value?.findIndex((a) => a.id === applicationData.id);
      if (applicationIndex !== undefined && applicationIndex !== -1) {
        applications.value[applicationIndex] = application;
      }
      addNotification(`Заявка обновлена`, "success");
    } else {
      applications.value.unshift(application);
      toggleApplicationModal(false);
      addNotification(`Заявка добавлена`, "success");
    }
    toggleApplicationModal(false);
  } catch (error: any) {
    addNotification("Ошибка: " + error, "error");
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const totalApplicationsSum = computed(() => {
  if (!applications.value) return 0;
  return applications.value.reduce((acc, application) => (application.isIncome ? acc + application.sum : acc - application.sum), 0);
});

const handleChangeStatus = async (docId: number, statusId: number) => {
  try {
    isLoading.value = true;
    actionError.value = null;

    await $fetch(`/api/project/${route.params.id}/document/${docId}`, {
      method: "PUT",
      body: {
        statusId,
      },
    });
    addNotification(`Статус закрытия документа обновлен`, "success");
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка при обновлении статуса";
  } finally {
    isLoading.value = false;
  }
};

const handleLawyerCheck = async () => {
  try {
    isLoading.value = true;
    actionError.value = null;

    const { is_readed } = await $fetch(`/api/project/${route.params.id}/lawyer-check`, {
      method: "PUT",
    });

    if (is_readed && project.value) {
      project.value.is_readed = isReaded.value;
    }
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка при обновлении статуса";
  } finally {
    isLoading.value = false;
  }
};

const handleCorrection = async () => {
  try {
    isLoading.value = true;
    actionError.value = null;

    const { isCorrection: updatedCorrection } = await $fetch(`/api/project/${route.params.id}/correction`, {
      method: "PUT",
    });

    if (typeof updatedCorrection === "boolean" && project.value) {
      project.value.isCorrection = updatedCorrection;
      isCorrection.value = updatedCorrection;
    }
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка при обновлении статуса правок";
  } finally {
    isLoading.value = false;
  }
};

const handleSavePrecedent = async (precedent: string) => {
  try {
    isLoading.value = true;
    actionError.value = null;

    const response = await $fetch<{ precedent: string }>(`/api/project/${route.params.id}/precedent`, {
      method: "PUT",
      body: {
        precedent,
      },
    });

    if (project.value) {
      project.value.precedent = response.precedent;
    }

    showPrecedentModal.value = false;
    precedent ? addNotification("Прецедент добавлен", "success") : addNotification("Прецедент удален", "error");
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка при сохранении прецедента";
  } finally {
    isLoading.value = false;
  }
};

const filteredApplications = computed(() => {
  if (!applications.value) return [];
  if (!searchQuery) return applications.value;

  const query = searchQuery.value.toLowerCase();
  return applications.value.filter(
    (application) =>
      application.title?.toLowerCase().includes(query) ||
      application.document?.toLowerCase().includes(query) ||
      application.counterparty?.inn.toLowerCase().includes(query) ||
      application.counterparty?.bankAccount?.accountNumber?.toLowerCase().includes(query)
  );
});

const filteredJobs = computed(() => {
  if (!jobs.value) return [];
  if (!jobSearch) return jobs.value;

  const query = jobSearch.value.toLowerCase();
  return jobs.value.filter((job) => job.title?.toLowerCase().includes(query));
});

const totalJobSum = computed(() => jobs.value.reduce((acc, job) => acc + (job.sum || 0), 0));
const totalJobWithAK = computed(() => jobs.value.reduce((acc, job) => acc + (job.sumWithAk || 0), 0));
const totalJobWithTax = computed(() => jobs.value.reduce((acc, job) => acc + (job.sum + (job.sum * job.taxPercent) / 100 || 0), 0));

const handleAdminChange = async (app: IApplication, status: string, manager: string) => {
  show({
    message: `Вы уверены, что хотите изменить статус на "${status}"`,
    async onConfirm() {
      try {
        const application = await store.adminStatusChange(app, status, manager);

        const oldApplication = applications.value?.find((a) => a.id === app.id);
        if (application && oldApplication) {
          oldApplication.adminStatus = application.adminStatus;
          addNotification("Статус заявки изменён", "info");
        }

        showApplicationModal.value = false;
      } catch (error) {
        console.error("Error approving application:", error);
        addNotification("Произошла ошибка при изменении статуса", "error");
      }
    },
  });
};

const handleSaveJob = async (job: Omit<Job, "id">) => {
  try {
    isLoading.value = true;
    const res = await $fetch("/api/job/create", {
      method: "POST",
      body: {
        ...job,
      },
    });
    handleToggleJobModal(false);
    jobs.value.unshift(res);
    addNotification("Работа успешно добавлена", "success");
  } catch (error: any) {
    jobError.value = error.data?.message || "Произошла ошибка при добавлении работы";
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const handleEditPrice = async () => {
  try {
    if (editedSum.value < project.value!.payed_sum) {
      addNotification("Сумма проекта не может быть меньше оплаченной", "error");
      return;
    }
    const { sum } = await $fetch<{ sum: number }>(`/api/project/${route.params.id}/editPrice`, {
      method: "PUT",
      body: {
        sum: editedSum.value,
      },
    });

    isSumEditing.value = false;
    project.value!.sum = sum;
    addNotification("Сумма проекта успешно изменена", "info");
  } catch (error) {
    console.log(error);
  }
};

const updateApplications = (app: IApplication) => {
  applications.value.unshift(app);
};

const updateJobs = (job: IJob, type: string) => {
  const index = jobs.value.findIndex((j) => j.id === job.id);
  if (index === undefined || index === -1) return;

  switch (type) {
    case "delete":
      jobs.value.splice(index, 1);
      break;

    case "update":
      jobs.value[index] = job;
      break;

    default:
      console.warn(`Unknown action type: ${type}`);
      break;
  }
};

const archiveProject = async () => {
  show({
    title: "Архивирование проекта",
    message: "Вы уверены что хотите заархивировать данный проект?",
    onConfirm: async () => {
      try {
        await $fetch(`/api/project/${route.params.id}/archive`, { method: "PUT" });
        project.value!.isArchived = true;
        addNotification("Проект успешно заархивирован", "info");
      } catch (error) {
        console.log(error);
        addNotification("Ошибка при архивировании проекта", "error");
      }
    },
  });
};

const handleSaveProject = async (newProject: IProject) => {
  const { counterparty, Legal_entity, Project_status, ...projectData } = newProject;
  try {
    isLoading.value = true;
    actionError.value = null;

    if (newProject.Legal_entity_id !== newProject.counterparty?.legalEntityId) {
      const newId = await store.createCounterParty(
        { ...newProject.counterparty, legalEntityId: newProject.Legal_entity_id },
        newProject.Legal_entity.dbName!
      );
      if (!newId) {
        addNotification("Ошибка при создании нового контрагента", "error", null);
        return;
      }
      projectData.counterparty_id = newId;
    }

    const response = await $fetch<IProject>(`/api/project/${newProject.id}`, {
      method: "PUT",
      body: projectData,
    });

    project.value = { ...project.value, ...response };
    addNotification(`Проект "${newProject.title}" обновлен`, "success");
  } catch (error: any) {
    actionError.value = error.data?.message || "Произошла ошибка";
    console.error("Ошибка при сохранении проекта:", error);
  } finally {
    isLoading.value = false;
    toggleProjectModal(false);
  }
};

const updateEdo = (val: boolean) => {
  project.value!.isDocsEDO = val;
};

const canEdit = computed(() => {
  if (!user.value) return false;
  if (user.value.role === "ADMIN") return true;

  if (project.value?.managerId !== user.value.id) return false;
  if (project.value.isArchived || project.value.Project_status.title === "Сдан" || project.value.Project_status.title === "Проект завершен")
    return false;

  return true;
});

useHead({
  title: `MCRM | ${project.value?.title}`,
  meta: [{ name: "description", content: `MCRM | Проект ${project.value?.title}` }],
});
</script>

<template>
  <div :class="{ 'opacity-80 pointer-events-none': project?.isArchived }" class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <div v-if="project?.isArchived" class="fixed top-0 left-0 right-0 z-50 bg-yellow-500 border-b border-yellow-600">
      <div class="container mx-auto px-4 py-2">
        <div class="flex items-center justify-center">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="text-sm font-medium">Проект находится в архиве. Только для просмотра.</span>
        </div>
      </div>
    </div>
    <div class="p-4 lg:p-8">
      <div class="mb-8">
        <div class="flex justify-between items-start gap-20">
          <div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-white">{{ project?.title }}</h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1 break-all max-w-[600px]">
              {{ project?.description }}
            </p>
          </div>
          <div class="flex flex-col items-start">
            <div class="text-right flex items-start gap-3">
              <div class="text-gray-900 dark:text-white space-x-2 relative text-start">
                <span class="text-sm text-gray-600 dark:text-gray-400">Сумма проекта:</span>
                <template v-if="!isSumEditing">
                  <button v-if="canEdit" @click="isSumEditing = true" class="absolute -top-4 -right-4">
                    <IconsPencil class="w-4 h-4" />
                  </button>
                  <span class="text-2xl font-bold">{{ formatCurrency(project?.sum as unknown as number) }}</span>
                </template>
                <input
                  v-else
                  @blur="handleEditPrice"
                  @keyup.enter="handleEditPrice"
                  v-model.number="editedSum"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  type="text"
                />
              </div>

              <div class="text-gray-900 dark:text-white space-x-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Оплачено: </span>
                <span class="text-2xl font-bold" :class="[Number(project!.payed_sum) < Number(project!.sum) ? 'text-red-500' : 'text-green-500']">{{
                  formatCurrency(project?.payed_sum as unknown as number)
                }}</span>
              </div>
            </div>
            <div class="text-gray-900 dark:text-white space-x-2 text-start">
              <span class="text-sm text-gray-600 dark:text-gray-400">Менеджер проекта:</span>
              <span class="text-2xl font-bold">{{ project?.manager?.full_name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-8">
        <div class="grid grid-cols-5 gap-6">
          <div class="bg-white dark:bg-gray-800 shadow p-6 col-span-2" :class="project?.precedent ? '' : 'rounded-t-lg'">
            <ProjectMainInfo v-if="project" :project="project" :can-edit="canEdit" @open-edit-modal="toggleProjectModal(true)" />
            <ProjectLawyerButton
              v-if="project"
              v-model:isReaded="isReaded"
              v-model:isCorrection="isCorrection"
              @handle-lawyer-check="handleLawyerCheck"
              @handleCorrection="handleCorrection"
            />
          </div>

          <ProjectDocumentList
            class="col-span-3"
            :statuses="closedDocStatuses || []"
            :is-edo="project!.isDocsEDO"
            :is-readed="project!.is_readed"
            :is-archived="project!.isArchived"
            :can-edit="canEdit"
            @handle-change-status="handleChangeStatus"
            @update-edo="updateEdo"
          />
        </div>

        <div class="bg-white dark:bg-gray-800 shadow" :class="project?.precedent ? 'rounded-b-lg' : ''">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Работы в проекте</h2>
                <div class="flex gap-6 text-sm">
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">Итого: </span>
                    <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalJobSum) }}</span>
                  </div>
                  <!-- <div>
                    <span class="text-gray-600 dark:text-gray-400">Итого с НДС</span>
                    <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalJobWithTax) }}</span>
                  </div> -->
                  <!-- <div>
                    <span class="text-gray-600 dark:text-gray-400">Итого с АК 10%</span>
                    <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalJobWithAK) }}</span>
                  </div> -->
                </div>
              </div>
              <div class="flex items-center gap-4">
                <UiInput v-model="jobSearch" placeholder="Поиск по работам..." :icon="IconsSearch" size="sm" />

                <div v-if="user && !project!.isArchived" class="flex items-center gap-2">
                  <UiButton @click="handleToggleJobModal(true)">
                    <IconsPlus class="w-4 h-4" />
                    Добавить работу
                  </UiButton>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="p-4" v-if="isJobLoading">
              <SharedSkeleton :count="4" height="h-full" rounded="rounded-lg" class="h-72" />
            </div>
            <template v-else>
              <div v-if="filteredJobs.length > 0" class="p-4">
                <JobTable
                  :legal-entity-id="project!.Legal_entity_id"
                  :jobs="filteredJobs"
                  :totalSum="totalJobSum"
                  :totalSumWithTax="totalJobWithTax"
                  :totalSumWithAk="totalJobWithAK"
                  @update-jobs="updateJobs"
                />
              </div>
              <div v-else class="flex items-center justify-center py-4 text-gray-500">Нет работ</div>
            </template>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 shadow" :class="project?.precedent ? 'rounded-b-lg' : ''">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Заявки в проекте</h2>
                <div class="flex gap-6 text-sm">
                  <div>
                    <span class="text-gray-600 dark:text-gray-400">Итоговая сумма:</span>
                    <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatCurrency(totalApplicationsSum) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <UiInput v-model="searchQuery" placeholder="Поиск по заявкам..." :icon="IconsSearch" size="sm" />

                <div v-if="user && !project!.isArchived" class="flex items-center gap-2">
                  <div class="relative inline-block">
                    <button
                      @click="isDropdownOpen = !isDropdownOpen"
                      class="bg-gradient-to-r from-blue-700 text-sm to-blue-500 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <IconsPlus class="h-4 w-4" />
                      Заявка на оплату
                      <IconsChevron class="h-4 w-4 ml-1 transition-transform duration-200" :class="{ 'rotate-180': isDropdownOpen }" />
                    </button>

                    <Transition name="fade">
                      <div
                        v-if="isDropdownOpen"
                        @click.away="isDropdownOpen = false"
                        class="absolute z-10 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-gradient-to-b from-blue-600 to-blue-500 ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div class="py-1">
                          <button
                            @click="
                              toggleApplicationModal(true);
                              isIncome = false;
                            "
                            class="block w-full px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors duration-150 text-start"
                          >
                            Создать новую
                          </button>
                          <button
                            @click="toggleApplicationSearchModal(true)"
                            class="block w-full px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors duration-150 text-start"
                          >
                            Выбрать существующую
                          </button>
                        </div>
                      </div>
                    </Transition>
                  </div>
                  <button
                    @click="
                      isIncome = true;
                      toggleApplicationModal(true);
                    "
                    class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-700 to-cyan-500 hover:to-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <IconsPlus class="w-4 h-4" />
                    Выставить счет
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4" v-if="isAppLoading">
              <SharedSkeleton v-for="i in 3" :count="3" height="h-full" rounded="rounded-lg" class="h-96" />
            </div>

            <template v-else>
              <div
                v-if="filteredApplications.length"
                class="divide-y divide-gray-200 dark:divide-gray-700 grid grid-cols-2 max-xl:grid-cols-1 gap-4 p-4"
              >
                <ApplicationItem
                  v-for="application in filteredApplications"
                  :key="application.id"
                  :application="application"
                  @handle-edit="handleSaveApplication"
                  @handleAdminChange="handleAdminChange"
                />
              </div>

              <div v-else class="flex items-center justify-center py-4 text-gray-500">Нет заявок</div>
            </template>
          </div>
        </div>

        <ProjectPrecedent
          :class="project.precedent ? '-order-1 rounded-t-lg' : 'rounded-b-lg'"
          v-if="project"
          :project="project"
          @handle-save="handleSavePrecedent"
          @open-add-precedent-modal="openAddPrecedentModal"
        />
      </div>
      <button
        v-if="
          ((!project?.isArchived && project?.Project_status.title === 'Сдан') || project?.Project_status.title === 'Проект завершен') &&
          (user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT')
        "
        @click="archiveProject"
        class="mt-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-500 hover:to-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <IconsTrash class="w-5 h-5" />
        Архивировать проект
      </button>
    </div>

    <Transition name="fade">
      <ApplicationModal
        v-if="showApplicationModal"
        @submit="handleSaveApplication"
        @handle-toggle-modal="toggleApplicationModal"
        :project-id="project?.id"
        :in-come="isIncome"
        :is-loading="isLoading"
        :error="actionError"
      />
    </Transition>

    <Transition name="fade">
      <JobModal
        v-if="isJobModalOpen"
        @submit="handleSaveJob"
        @handle-toggle-modal="handleToggleJobModal"
        :projectId="project!.id"
        :is-loading="isLoading"
        :error="jobError"
        :legal-entity-id="project?.Legal_entity_id!"
      />
    </Transition>

    <ProjectPrecedentModal
      v-if="showPrecedentModal"
      v-model="showPrecedentModal"
      :project="project"
      :is-loading="isLoading"
      :error="actionError"
      @save="handleSavePrecedent"
    />
    <Transition name="fade">
      <ApplicationSearch
        v-if="isSearchModalOpen"
        :project-id="project?.id"
        @update-applications="updateApplications"
        @handle-toggle-modal="toggleApplicationSearchModal"
      />
    </Transition>

    <!-- @vue-ignore -->
    <ProjectModal
      v-if="isEditModalOpen"
      :project="project"
      :legal-entities="store.entities"
      :error="actionError"
      :is-loading="isLoading"
      :selected-status-id="null"
      @save="handleSaveProject"
      @handle-toggle-modal="toggleProjectModal"
    />
  </div>
</template>

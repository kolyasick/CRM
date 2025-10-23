<script setup lang="ts">
import type { Role, User } from "@prisma/client";
import { fa } from "zod/v4/locales";

const store = useGeneralStore();

interface IUser extends User {
  role: Role;
}

const users = ref<IUser[]>([]);
const isEditModalOpen = ref(false);
const editingUser = ref<IUser | null>(null);
const isLoading = ref(false);

const form = ref({
  email: "",
  full_name: "",
  password: "",
});

const toggleEditModal = (val: boolean, user: IUser | null) => {
  editingUser.value = user;

  if (val && user) {
    form.value = {
      email: user.email || "",
      full_name: user.full_name || "",
      password: "",
    };
  } else {
    form.value = {
      email: "",
      full_name: "",
      password: "",
    };
  }

  isEditModalOpen.value = val;
  store.switchBody(val);
};

const saveUser = async () => {
  if (!editingUser.value) return;

  try {
    isLoading.value = true;
    const response = await $fetch(`/api/admin/user/${editingUser.value.id}/edit`, {
      method: "PUT",
      body: {
        email: form.value.email,
        full_name: form.value.full_name,
        ...(form.value.password && { password: form.value.password }),
      },
    });

    const index = users.value.findIndex((u) => u.id === editingUser.value?.id);
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...form.value };
    }

    toggleEditModal(false, null);

    console.log("Пользователь успешно обновлен");
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await $fetch<IUser[]>("/api/admin/user/findAll");
    users.value = res;
  } catch (error) {
    console.log(error);
  }
});
</script>

<template>
  <NuxtLayout name="admin-layout">
    <SharedPageTitle class="mb-6" title="Список всех пользователей" subtitle="Управление пользователями MCRM" />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Фамилия</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Роль</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <span class="px-2 py-1 rounded text-xs font-medium capitalize text-gray-900 dark:text-gray-500">
                    {{ user.id }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ user?.full_name }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 dark:text-white">
                  {{ user?.email }}
                </div>
              </td>
              <td class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ user.role.title }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                <button @click="toggleEditModal(true, user)" class="p-2">
                  <IconsPencil class="w-5 h-5 dark:text-gray-500 text-gray-400" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!users || !users.length" class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Нет данных о пользователях</p>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="isEditModalOpen"
        @click.self="toggleEditModal(false, null)"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 z-20">
          <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">Редактирование пользователя</h2>

          <form @submit.prevent="saveUser">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Никнейм</label>
              <input
                v-model="form.full_name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Новый пароль (оставьте пустым, если не хотите менять)
              </label>
              <input
                v-model="form.password"
                type="password"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Введите новый пароль"
              />
            </div>

            <div class="flex justify-end gap-3">
              <button
                type="button"
                @click="toggleEditModal(false, null)"
                class="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="isLoading"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <IconsLoader v-if="isLoading" class="w-4 h-4 animate-spin" />
                <span v-else>Сохранить</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </NuxtLayout>
</template>

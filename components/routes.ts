import Company from "./icons/Company.vue";
import Dashboard from "./icons/Dashboard.vue";
import Partners from "./icons/Partners.vue";
import DocumentList from "./icons/DocumentList.vue";
import Document from "./icons/Document.vue";
import Projects from "./icons/Projects.vue";
import Archive from "./icons/Archive.vue";
import Statistics from "./icons/Statistics.vue";
import Admin from "./icons/Admin.vue";
import Money from "./icons/Money.vue";

export const routes = [
  {
    title: "Дашборд",
    path: "/",
    icon: Dashboard,
  },
  {
    title: "Наши юр. лица",
    path: "/entities",
    icon: Company,
  },
  {
    title: "Контрагенты",
    path: "/counterparties",
    icon: Partners,
  },
  {
    title: "Проекты",
    path: "/projects",
    icon: Projects,
  },

  {
    title: "Заявки",
    path: "/applications",
    icon: Document,
  },
  {
    title: "Реестр ПД",
    path: "/registry",
    icon: DocumentList,
  },
  {
    title: "Задолженности",
    path: "/debt",
    icon: Money,
  },
  {
    title: "Архив",
    path: "/archive",
    icon: Archive,
  },
  {
    title: "Статистика",
    path: "/statistics",
    icon: Statistics,
  },
  {
    title: "Админ-панель",
    path: "/admin",
    icon: Admin,
  },
];

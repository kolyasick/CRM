export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn, user } = useUserSession();

  if (loggedIn.value && to.path === "/login") {
    return navigateTo("/");
  }

  // if (to.path === "/register" && user.value?.role !== "ADMIN") {
  //   return navigateTo("/");
  // }

  if (user.value?.role !== "ADMIN" && to.path === "/statistics") {
    return navigateTo("/");
  }

  if (to.path.includes("admin") && user.value?.email !== "admin@mail.ru") {
    return navigateTo("/");
  }
});

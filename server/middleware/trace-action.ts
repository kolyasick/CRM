import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  const path = event.path || "";
  if (path.includes("/admin") && user?.role !== "ADMIN") {
    throw createError({
      statusCode: 401,
      message: "Access denied",
    });
  }

  if (path === "/api/_auth/session" && event.method === "DELETE") {
    try {
      if (user?.role !== "ADMIN") {
        await prisma.action.create({
          data: {
            userId: user?.id!,
            url: path,
            method: event.method,
            statusCode: event.node.res.statusCode,
            description: "Вышел из аккаунта",
          },
        });
      }
    } catch (error) {
      console.log("Ошибка Action: ", error);
    }
  }
});

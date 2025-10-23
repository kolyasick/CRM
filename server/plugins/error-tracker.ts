import prisma from "~/lib/prisma";

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", async (error, { event }) => {
    if (!event || process.env.NODE_ENV === "development") return;

    try {
      const { user } = await getUserSession(event);

      // if (event.node.res.statusCode === 401) {
      //   console.log("logout");
      // }

      if (user?.id) {
        await prisma.action.create({
          data: {
            userId: user.id,
            url: event.path || "",
            method: event.method || "",
            statusCode: event.node.res.statusCode,
            description: `Системная ошибка: ${error.message.toLocaleLowerCase() || "неизвестная ошибка"}`,
          },
        });
      }
    } catch (dbError) {
      console.error("Ошибка при записи ошибки в БД:", dbError);
    }
  });

  nitroApp.hooks.hook("afterResponse", async (event) => {
    const { user } = await getUserSession(event);

    if (event.node.res.statusCode >= 400 && user?.id) {
      try {
        await prisma.action.create({
          data: {
            userId: user.id,
            url: event.path || "",
            method: event.method || "",
            statusCode: event.node.res.statusCode,
            description: `HTTP ошибка: ${event.node.res.statusMessage.toLocaleLowerCase() || "ошибка запроса"}`,
          },
        });
      } catch (error) {
        console.error("Ошибка Action (afterResponse):", error);
      }
    }
  });
});

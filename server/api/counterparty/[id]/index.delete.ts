import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };
  const { user } = await getUserSession(event);

  if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
  try {
    const counterparty = await prisma.counterparty.delete({
      where: { id },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Удалил контрагента "${counterparty.title}"`,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return counterparty;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Неизвестная ошибка при удалении контрагента",
    });
  }
});

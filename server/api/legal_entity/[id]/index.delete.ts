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
    const legalEntity = await prisma.legal_entity.delete({
      where: { id: parseInt(id) },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Удалил юр. лицо "${legalEntity.title}"`,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return legalEntity;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при удалении юр. лица",
    });
  }
});

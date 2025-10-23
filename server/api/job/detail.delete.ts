import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = await getQuery(event) as { id: string };
  const { user } = await getUserSession(event);

  try {
    const legalEntity = await prisma.jobDetail.delete({
      where: { id: parseInt(id) },
    });

    return legalEntity;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при удалении позиции",
    });
  }
});

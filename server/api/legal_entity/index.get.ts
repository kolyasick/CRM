import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id, onlySelect } = getQuery<{ id?: string; onlySelect?: string }>(event);
  try {
    let legalEntities;
    if (Boolean(onlySelect)) {
      legalEntities = await prisma.legal_entity.findMany({
        select: {
          id: true,
          title: true,
          dbName: true,
          tax: true,
          inn: true,
        },
      });
    } else {
      legalEntities = await prisma.legal_entity.findMany({
        where: {
          id: id ? parseInt(id) : undefined,
        },
        include: {
          bankAccount: true,
        },
      });
    }
    return legalEntities || [];
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении юр. лиц",
    });
  }
});

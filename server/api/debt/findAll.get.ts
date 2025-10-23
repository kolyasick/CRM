import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const debs = await prisma.application.findMany({
      where: {
        isIncome: true,
        isPayed: false,
      },
      include: {
        projects: {
          select: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        legalEntity: {
          select: {
            id: true,
            title: true,
          },
        },
        counterparty: {
          select: {
            id: true,
            title: true,
            inn: true,
            phone: true,
          },
        },
      },
    });

    return debs.map((deb) => ({
      ...deb,
      project: deb.projects[0].project,
      projects: undefined,
    }));
  } catch (error) {
    console.error("Ошибка при получении задолженностей:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении задолженностей",
    });
  }
});

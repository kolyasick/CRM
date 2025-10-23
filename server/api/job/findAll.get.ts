import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { counterPartyId, projectId } = getQuery<{ counterPartyId?: string; projectId?: string }>(event);
  try {
    const jobs = await prisma.job.findMany({
      where: {
        projectId: projectId ? parseInt(projectId) : undefined,
        // counterPartyId: counterPartyId ? counterPartyId : undefined,
      },
      include: {
        details: {
          include: {
            counterparty: true,
          },
        },
        counterParty: {
          select: {
            title: true,
            id: true,
            form: true,
            inn: true,
            legalEntityId: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    return jobs || [];
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении работ",
    });
  }
});

import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id, projects, contractor, onlySelect, limit, offset } = getQuery<{
    id?: string;
    projects?: string;
    contractor?: string;
    onlySelect?: string;
    limit?: string;
    offset?: string;
  }>(event);

  try {
    let counterparties;
    if (onlySelect) {
      counterparties = await prisma.counterparty.findMany({
        select: {
          id: true,
          title: true,
        },
        where: {
          id,
          isContractor: Boolean(contractor),
        },
      });
    } else {
      counterparties = await prisma.counterparty.findMany({
        include: {
          project: Boolean(projects)
            ? {
                select: {
                  id: true,
                  title: true,
                },
              }
            : false,
          counterparty_contact: true,
          bankAccount: true,
          legalEntity: {
            select: {
              title: true,
              dbName: true,
            },
          },
          manager: {
            select: {
              id: true,
              realEmail: true,
            },
          },
        },
        where: {
          id,
          isContractor: Boolean(contractor),
        },
        take: limit ? parseInt(limit) : undefined,
        skip: offset ? parseInt(offset) : undefined,
      });
    }

    return counterparties || [];
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении контрагентов",
    });
  }
});

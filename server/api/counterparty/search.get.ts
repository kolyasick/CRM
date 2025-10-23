import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { q, legalEntityId, projects, isAgreed, limit, offset ,id} = getQuery<{
    q?: string;
    legalEntityId?: string;
    projects?: string;
    isAgreed?: string;
    limit?: string;
    offset?: string;
    id?: string;
  }>(event);
  try {
    const counterparties = await prisma.counterparty.findMany({
      where: {
        isContractor: false,
        legalEntityId: legalEntityId ? parseInt(legalEntityId) : undefined,
        isAgreed: isAgreed ? Boolean(parseInt(isAgreed)) : true,
        id,
        OR: [
          {
            title: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            inn: {
              equals: q,
            },
          },
        ],
      },
      include: Boolean(projects)
        ? {
            project: {
              select: {
                title: true,
                id: true,
              },
            },
            bankAccount: true,
            counterparty_contact: true,
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
          }
        : {
            bankAccount: true,
          },
      take: limit ? parseInt(limit) : 20,
      skip: offset ? parseInt(offset) : undefined,
      orderBy: {
        project: {
          _count: "desc",
        },
      },
    });

    return counterparties;
  } catch (error) {
    console.error("Error searching counterparties:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to search counterparties",
    });
  }
});

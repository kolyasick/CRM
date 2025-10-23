import prisma from "~/lib/prisma";

type Query = {
  q?: string;
  type?: string;
  status?: string;
  date?: string;
  limit?: string;
  offset?: string;
};

export default defineEventHandler(async (event) => {
  const { q, type, status, date, limit, offset } = getQuery<Query>(event);
  try {
    const docs = await prisma.primaryDocument.findMany({
      where: {
        OR: [
          {
            invoiceNumber: {
              contains: q,
              mode: "insensitive",
            },
          },
          {
            project: {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
          {
            manager: {
              full_name: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
          {
            counterParty: {
              title: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        ],
        type: {
          equals: type,
        },
        status: {
          equals: status,
        },
        invoiceDate: date
          ? {
              equals: new Date(date),
            }
          : undefined,
      },
      include: {
        project: {
          select: {
            title: true,
            id: true,
          },
        },
        application: {
          select: {
            id: true,
            paymentDate: true
          }
        },
        manager: {
          select: {
            full_name: true,
          },
        },
        legalEntity: {
          select: {
            title: true,
          },
        },
        counterParty: {
          select: {
            id: true,
            title: true,
            inn: true,
          },
        },
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
      orderBy: {
        id: "desc",
      },
    });

    return docs;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении списка ПД",
    });
  }
});

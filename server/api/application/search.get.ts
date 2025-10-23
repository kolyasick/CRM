import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { q } = getQuery<{
    q?: string;
  }>(event);

  try {
    const apps = await prisma.application.findMany({
      where: {
        isIncome: false,
        adminStatus: {
          title: "Согласовано",
        },
        parentId: null,
        title: {
          contains: q,
          mode: "insensitive",
        },
        projects: {
          some: {
            sum: {
              gt: 0,
            },
          },
        },
      },
      include: {
        counterparty: true,
        adminStatus: true,
        projects: {
          select: {
            project: true,
            sum: true,
            applicationId: true,
          },
        },
      },
    });

    return apps.map((a) => {
      return {
        ...a,
        partSum: a.projects.find((p) => {
          return p.applicationId === a.id;
        })?.sum,
      };
    });
  } catch (error) {
    console.error("Error searching apps:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to search apps",
    });
  }
});

import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { username, limit, offset, period, type } = getQuery<{
    username?: string;
    offset?: string;
    limit?: string;
    period?: string;
    type?: string;
  }>(event);

  try {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const now = new Date();

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "yesterday":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      default:
        break;
    }

    const actions = await prisma.action.findMany({
      where: {
        type,
        user: {
          full_name: {
            contains: username,
            mode: "insensitive",
          },
        },
        ...(period &&
          period !== "all" && {
            time: {
              gte: startDate,
              lt: endDate,
            },
          }),
      },
      include: {
        user: {
          omit: {
            password: true,
          },
        },
      },
      orderBy: {
        time: "desc",
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    return actions;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении логов действий",
    });
  }
});

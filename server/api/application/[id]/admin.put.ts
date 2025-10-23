import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const { user } = await getUserSession(event);
  const { status } = await readBody<{ status: string }>(event);

  if (!user || user?.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
    });
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    });
  }
  const application = await prisma.application.update({
    where: { id: parseInt(id) },
    data: {
      adminStatus: {
        connect: {
          title: status,
        },
      },
      accountDate: new Date(),
    },
    include: {
      adminStatus: true,
      counterparty: {
        select: {
          id: true,
          inn: true,
          title: true,
        },
      },
      legalEntity: {
        select: {
          id: true,
          title: true,
          inn: true,
          dbName: true,
        },
      },
    },
  });

  await prisma.action.create({
    data: {
      method: event.method,
      url: event.path,
      description: status === "Согласовано" ? `Согласовал заявку №${application.id}` : `Отклонил заявку №${application.id}`,
      link: "/applications?id=" + application.id,
      statusCode: event.node.res.statusCode,
      userId: user!.id,
      type: "moderate",
    },
  });

  return application;
});

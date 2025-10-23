import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event);
  if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const id = event.context.params?.id;
  if (!id) {
    throw createError({
      statusCode: 400,
      message: "ID is required",
    });
  }

  try {
    const counterparty = await prisma.counterparty.update({
      where: { id },
      data: { isAgreed: true },
      include: {
        counterparty_contact: true,
        project: true,
        legalEntity: true,
        bankAccount: true,
      },
    });
    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Согласовал нового контрагента "${counterparty.title}"`,
          link: "/counterparties?id=" + counterparty.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return counterparty;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to approve counterparty",
    });
  }
});

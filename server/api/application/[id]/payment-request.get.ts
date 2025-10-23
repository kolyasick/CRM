import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { id } = getRouterParams(event);
  const { user } = await getUserSession(event);
  try {
    const application = await prisma.application.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isPaymentRequested: true,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Сделал запрос на получение П/П`,
          link: "/applications?id=" + application.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.log(error);
  }
});

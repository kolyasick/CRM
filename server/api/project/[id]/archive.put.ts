import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const id = parseInt(event.context.params?.id as string);
  try {
    const project = await prisma.project.update({
      where: {
        id,
      },
      data: {
        isArchived: true,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Архивировал проект "${project.title}"`,
          link: "/project/" + project.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Ошибка при архивировании проекта",
    });
  }
});

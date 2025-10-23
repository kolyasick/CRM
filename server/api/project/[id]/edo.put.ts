import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const { isEdo } = await readBody<{ isEdo: boolean }>(event);
  try {
    const id = Number(event.context.params?.id);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        isDocsEDO: isEdo,
      },
      select: {
        isDocsEDO: true,
        id: true,
        title: true,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Отметил что документы в ЭДО в проекте "${updatedProject.title}"`,
          link: "/project/" + updatedProject.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return updatedProject.isDocsEDO;
  } catch (error: any) {
    console.error("Error updating project sum:", error);
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});

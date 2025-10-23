import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);

  if (!user || user.role !== "LAWYER") {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied",
    });
  }
  try {
    const id = Number(event.context.params?.id);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { is_readed: true },
      select: {
        is_readed: true,
        title: true,
        id: true,
      },
    });

    await prisma.action.create({
      data: {
        method: event.method,
        url: event.path,
        description: `Отметил что документы прочитаны юристом в проекте "${updatedProject.title}"`,
        link: "/project/" + updatedProject.id,
        statusCode: event.node.res.statusCode,
        userId: user!.id,
        type: "moderate",
      },
    });

    return updatedProject;
  } catch (error: any) {
    console.error("Error updating project:", error);
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});

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
      data: { isCorrection: true },
      select: {
        isCorrection: true,
        id: true,
        title: true,
      },
    });

    await prisma.action.create({
      data: {
        method: event.method,
        url: event.path,
        description: `Направил на правки проект "${updatedProject.title}"`,
        link: "/project/" + updatedProject.id,
        statusCode: event.node.res.statusCode,
        userId: user!.id,
      },
    });

    return updatedProject;
  } catch (error: any) {
    console.error("Error updating project correction status:", error);
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});

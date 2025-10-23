import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const { id } = event.context.params as { id: string };
  const body = await readBody(event);
  const { precedent } = body;

  try {
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        precedent: precedent ? precedent : null,
      },
      select: {
        precedent: true,
        id: true,
        title: true,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `${precedent ? "Добавил" : "Удалил"} прецедент "${project.title}" `,
          link: "/project/" + project.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return project;
  } catch (error) {
    console.error("Error updating project status:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update project status",
    });
  }
});

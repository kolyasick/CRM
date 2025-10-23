import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };
  const { user } = await getUserSession(event);

  if (!user || user.role !== "ADMIN" && user.role !== "LAWYER") {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }
  try {
    const project = await prisma.project.delete({
      where: { id: parseInt(id) },
      include: {
        project_document: true,
      },
    });

    if (project.project_document.length) {
      await Promise.all(project.project_document.map(async (file) => await deleteFile(file.url)));
    }

    return project;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to delete project",
    });
  }
});

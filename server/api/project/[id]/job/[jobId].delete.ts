import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const { id, jobId } = event.context.params as { id: string; jobId: string };

  try {
    const job = await prisma.job.delete({
      where: {
        id: parseInt(jobId),
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Удалил работу ${job.title} в проекте №${job.projectId}`,
          link: "/project/" + job.projectId,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting job:", error);

    throw createError({
      statusCode: 500,
      message: "Failed to delete job",
    });
  }
});

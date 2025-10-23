import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };

  try {
    const project = await prisma.project.findUnique({
      include: {
        Project_status: true,
        counterparty: {
          select: {
            id: true,
            title: true,
            inn: true,
            form: true,
            isAgreed: true,
            legalEntityId: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
        manager: {
          select: {
            full_name: true,
          },
        },
        Legal_entity: {
          select: {
            id: true,
            title: true,
            dbName: true,
          },
        },
      },
      where: {
        id: id ? parseInt(id) : undefined,
      },
    });

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: "Project not found",
      });
    }

    return {
      ...project,
      applications: project._count.applications,
      _count: undefined,
    };
  } catch (error) {
    console.error("Error fetching project:", error);
    throw createError({
      statusCode: 404,
      fatal: true,
      message: "Проект не найден",
    });
  }
});

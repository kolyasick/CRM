import { Job, JobDetail } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const body = await readBody<Omit<Job, "id"> & { details: JobDetail[] }>(event);
  if (!body.title || !body.qty || !body.unit || !body.price || !body.sum || !body.ourSum || !body.sumWithAk || !body.projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Заполните все обязательные поля",
    });
  }

  try {
    const job = await prisma.job.create({
      data: {
        ...body,
        details: {
          createMany: {
            data: body.details.map((p) => ({ price: p.price, qty: p.qty, title: p.title, unit: p.unit, counterpartyId: p.counterpartyId })),
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        counterParty: {
          select: {
            id: true,
            title: true,
          },
        },
        details: {
          include: {
            counterparty: {
              select: {
                id: true,
                form: true,
                inn: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Добавил работу "${job.title}" в проекте "${job.project.title}" №${job.project.id}`,
          link: "/project/" + job.projectId,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return job;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлении работы",
    });
  }
});

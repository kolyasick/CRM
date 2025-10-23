import { Job, JobDetail } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const id = parseInt(event.context.params?.id as string);
  const body = await readBody<Job & { details: JobDetail[] }>(event);

  if (!body.title || !body.sum || !body.ourSum || !body.price || !body.qty || !body.unit || !body.sumWithAk) {
    throw createError({
      statusCode: 400,
      message: "Заполните все поля",
    });
  }

  try {
    await prisma.jobDetail.deleteMany({
      where: {
        jobId: id,
      },
    });

    const job = await prisma.job.update({
      where: {
        id,
      },
      data: {
        ...body,
        counterPartyId: body.details.length ? null : body.counterPartyId,
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
            form: true,
            inn: true,
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
          description: `Редактировал работу "${job.title}" в проекте "${job.project.title}" №${job.project.id}`,
          link: "/project/" + job.project.id,
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
      message: error as string,
    });
  }
});

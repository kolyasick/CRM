import { Application, Job, Position } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { id } = getRouterParams(event);
  const { user } = await getUserSession(event);

  const body = await readBody<
    Application & {
      positions: Position[];
      projectId: number;
      newProjectId: number;
      partSum?: number;
      paymentType: "invoice" | "contract";
      for: string;
    }
  >(event);

  body.title =
    body.paymentType === "invoice"
      ? `Оплата по счету №${body.accountNumber} от ${body.accountDate} за ${body.for}`
      : `Оплата по договору №${body.accountNumber} от ${body.accountDate} за ${body.for}`;

  if (!body.title || !body.sum || !body.counterpartyId || !body.legalEntityId || !body.moderatorId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Заполните все обязательные поля",
    });
  }

  try {
    await prisma.position.deleteMany({
      where: {
        applicationId: body.id,
      },
    });

    if (body.positions.length) {
      await prisma.position.createMany({
        data: body.positions.map((p) => ({ price: p.price, qty: p.qty, sum: p.sum, title: p.title, unit: p.unit, applicationId: body.id })),
      });
    }
    await prisma.projectApplications.update({
      where: {
        projectId_applicationId: {
          applicationId: body.id,
          projectId: body.projectId,
        },
      },
      data: {
        sum: body.partSum || 0,
      },
    });

    const application = await prisma.application.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        adminStatusId: body.adminStatusId,
        counterpartyId: body.counterpartyId,
        moderatorId: body.moderatorId,
        isUrgent: body.isUrgent,
        comment: body.comment || null,
        projects: {
          update: {
            where: {
              projectId_applicationId: {
                projectId: body.projectId,
                applicationId: body.id,
              },
            },
            data: {
              projectId: body.newProjectId,
            },
          },
        },
        legalEntityId: body.legalEntityId,
        sum: body.sum,
        sumWithTax: body.sumWithTax,
        taxPercent: body.taxPercent,
        accountDate: new Date(body.accountDate),
      },
      include: {
        adminStatus: true,
        legalEntity: {
          select: {
            id: true,
            title: true,
            dbName: true,
            inn: true,
          },
        },
        counterparty: {
          include: {
            bankAccount: true,
            counterparty_contact: true,
          },
        },
        positions: true,
        projects: {
          select: {
            sum: true,
            project: {
              select: {
                id: true,
                title: true,
                manager: {
                  select: {
                    id: true,
                    full_name: true,
                    realEmail: true,
                  },
                },
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            full_name: true,
            realEmail: true,
          },
        },
        payStatus: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Редактировал ${body.isIncome ? "счет" : "заявку на оплату"} №${application.id}`,
          link: "/applications?id=" + application.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return {
      ...application,
      partSum: application.projects.find((p) => {
        return p.project.id === body.newProjectId;
      })?.sum,
      project: application.projects.find((p) => {
        return p.project.id === body.newProjectId;
      })?.project,
    };
  } catch (error) {
    console.log(error);
  }
});

import { Job, Position } from "@prisma/client";
import { ServerFile } from "nuxt-file-storage";
import prisma from "~/lib/prisma";

type Body = {
  title: string;
  document: ServerFile;
  isIncome: boolean;
  projectId: number;
  newProjectId: number;
  accountDate: string;
  taxPercent: number;
  legalEntityId: number;
  sum: number;
  sumWithTax: number;
  moderatorId: number;
  positions: Position[];
  counterpartyId: string;
  isUrgent: boolean;
  comment?: string;
  adminStatusId?: number;
  partSum?: number;
  parentId?: number;
  accountNumber: string;
  paymentType: "invoice" | "contract";
  for: string;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event);
  await requireUserSession(event);
  const { user } = await getUserSession(event);

  body.title =
    body.paymentType === "invoice"
      ? `Оплата по счету №${body.accountNumber} от ${body.accountDate} за ${body.for}`
      : `Оплата по договору №${body.accountNumber} от ${body.accountDate} за ${body.for}`;

  if (!body.title || !body.sum || !body.newProjectId || !body.counterpartyId || !body.legalEntityId || (!body.isIncome && !body.moderatorId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Заполните все обязательные поля",
    });
  }

  try {
    const application = await prisma.application.create({
      data: {
        title: body.title,
        accountNumber: body.accountNumber,
        isIncome: body.isIncome,
        isUrgent: body.isUrgent,
        sumWithTax: body.sumWithTax,
        taxPercent: body.taxPercent,
        accountDate: new Date(body.accountDate),
        comment: body.comment || null,
        sum: body.sum,
        document: body.document ? body.document.name : null,
        parentId: body.parentId,
        counterparty: {
          connect: {
            id: body.counterpartyId,
          },
        },
        legalEntity: {
          connect: {
            id: body.legalEntityId,
          },
        },
        moderator: {
          connect: body.isIncome
            ? {
                email: "admin@mail.ru",
              }
            : {
                id: body.moderatorId,
              },
        },
        payStatus: {
          connect: {
            title: "Не оплачен",
          },
        },
        adminStatus: {
          connect: body.adminStatusId
            ? {
                id: body.adminStatusId,
              }
            : {
                title: body.isIncome ? "Согласовано" : "Не согласовано",
              },
        },
        projects: {
          create: {
            projectId: body.newProjectId,
            sum: body.partSum || 0,
          },
        },
        positions: {
          createMany: {
            data: body.positions.map((p) => ({
              price: parseFloat(p.price.toString()),
              qty: p.qty,
              sum: parseFloat(p.sum.toString()),
              title: p.title,
              unit: p.unit,
            })),
          },
        },
      },
      include: {
        projects: {
          select: {
            sum: true,
            project: {
              select: {
                id: true,
                title: true,
                manager: {
                  select: {
                    full_name: true,
                    realEmail: true,
                  },
                },
              },
            },
          },
        },
        positions: true,
        moderator: {
          select: {
            id: true,
            full_name: true,
            realEmail: true,
          },
        },
        legalEntity: {
          select: {
            id: true,
            title: true,
            dbName: true,
            inn: true,
          },
        },

        adminStatus: true,
        payStatus: true,
        counterparty: {
          include: {
            bankAccount: true,
            counterparty_contact: true,
          },
        },
      },
    });

    if (!application.isIncome) {
      await prisma.primaryDocument.create({
        data: {
          applicationId: application.id,
          amount: application.sum,
          invoiceDate: new Date(application.accountDate),
          provisionDeadline: new Date(new Date(body.accountDate).getTime() + 14 * 24 * 60 * 60 * 1000),
          managerId: user!.id,
          type: body.paymentType === "invoice" ? "Счет" : "Договор",
          status: "Не предоставлен",
          projectId: body.newProjectId,
          legalEntityId: body.legalEntityId,
          counterpartyId: body.counterpartyId,
          invoiceNumber: application.accountNumber!,
        },
      });
    }

    if (body.document) {
      const fileName = body.document.name;
      const lastDotIndex = fileName.lastIndexOf(".");
      const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
      await storeFileLocally(body.document, nameWithoutExtension);
    }

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `${body.isIncome ? "Выставил счет" : "Создал заявку на оплату"} №${application.id}`,
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
  } catch (e) {
    console.log(e);

    throw createError({
      statusCode: 500,
      statusMessage: "Что то пошло не так",
    });
  }
});

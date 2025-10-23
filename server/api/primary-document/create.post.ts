import { PrimaryDocument } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const body = await readBody<Omit<PrimaryDocument, "id">>(event);

  try {
    const doc = await prisma.primaryDocument.create({
      data: {
        amount: body.amount,
        documentLink: body.documentLink,
        invoiceDate: new Date(body.invoiceDate),
        invoiceNumber: body.invoiceNumber,
        type: body.type,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        provisionDeadline: body.paymentDate ? new Date(new Date(body.paymentDate!).getTime() + 14 * 24 * 60 * 60 * 1000) : undefined,
        status: body.status || "Не предоставлен",
        legalEntity: {
          connect: {
            id: body.legalEntityId,
          },
        },
        counterParty: {
          connect: {
            id: body.counterpartyId,
          },
        },
        manager: {
          connect: {
            id: user!.id,
          },
        },
        project: {
          connect: {
            id: body.projectId,
          },
        },
        application: body.applicationId
          ? {
              connect: {
                id: body.applicationId,
              },
            }
          : undefined,
      },
      include: {
        project: {
          select: {
            title: true,
            id: true,
          },
        },
        manager: {
          select: {
            full_name: true,
          },
        },
        legalEntity: {
          select: {
            title: true,
          },
        },
        counterParty: {
          select: {
            id: true,
            title: true,
            inn: true,
          },
        },
      },
    });

    return doc;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлении ПД",
    });
  }
});

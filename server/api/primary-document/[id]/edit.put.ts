import { PrimaryDocument } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const body = await readBody<Omit<PrimaryDocument, "id">>(event);
  const { id } = event.context.params as { id: string };

  try {
    const doc = await prisma.primaryDocument.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...body,
        amount: Number(body.amount),
        managerId: user!.id,
        invoiceDate: new Date(body.invoiceDate),
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
        provisionDeadline: new Date(new Date(body.paymentDate!).getTime() + 14 * 24 * 60 * 60 * 1000),
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
      message: "Ошибка при редактировании ПД",
    });
  }
});

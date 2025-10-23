import { BankAccount, Legal_entity } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };
  const body = await readBody<Legal_entity & { bankAccount: BankAccount }>(event);
  const { user } = await getUserSession(event);

  if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  try {
    const legalAddress = body.isPhysicalAddressEq ? body.physicalAddress : body.legalAddress;
    const mailAddress = body.isMailAddressEq ? legalAddress! : body.mailAddress;

    if (body.bankAccountId) {
      await prisma.bankAccount.update({
        where: {
          id: body.bankAccountId,
        },
        data: {
          title: body.bankAccount.title,
          address: body.bankAccount.address,
          bik: String(body.bankAccount.bik),
          city: body.bankAccount.city,
          cAccount: String(body.bankAccount.cAccount),
          accountNumber: String(body.bankAccount.accountNumber),
        },
      });
    } else {
      if (body.bankAccount.accountNumber) {
        const b = await prisma.bankAccount.create({
          data: {
            title: body.bankAccount.title,
            address: body.bankAccount.address,
            bik: String(body.bankAccount.bik),
            city: body.bankAccount.city,
            cAccount: String(body.bankAccount.cAccount),
            accountNumber: String(body.bankAccount.accountNumber),
          },
        });
        body.bankAccountId = b.id;
      }
    }
    const legalEntity = await prisma.legal_entity.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        form: body.form,
        inn: body.inn.toString(),
        kpp: body.kpp.toString(),
        ogrn: body.ogrn.toString(),
        physicalAddress: body.physicalAddress,
        legalAddress,
        isPhysicalAddressEq: body.isPhysicalAddressEq,
        bankAccountId: body.bankAccountId,
        mailAddress,
        isMailAddressEq: body.isMailAddressEq,
        phone: body.phone,
        email: body.email,
      },
      include: {
        bankAccount: true,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Редактировал юр. лицо "${legalEntity.title}"`,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return legalEntity;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при обновлении юр. лица",
    });
  }
});

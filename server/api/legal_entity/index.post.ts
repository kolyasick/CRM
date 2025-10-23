import { BankAccount, Legal_entity } from "@prisma/client";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const body = await readBody<Legal_entity & { bankAccount: BankAccount }>(event);

  try {
    const legalAddress = body.isPhysicalAddressEq ? body.physicalAddress : body.legalAddress;
    const mailAddress = body.isMailAddressEq ? legalAddress! : body.mailAddress;

    const ts = await prisma.$transaction(async (tx) => {
      const bankAccount = body.bankAccount?.bik
        ? await tx.bankAccount.create({
            data: {
              title: body.bankAccount.title,
              bik: body.bankAccount.bik.toString(),
              accountNumber: body.bankAccount.accountNumber?.toString(),
              address: body.bankAccount.address,
              city: body.bankAccount.city,
              cAccount: body.bankAccount.cAccount?.toString(),
            },
          })
        : null;

      const legalEntity = await tx.legal_entity.create({
        data: {
          title: body.title,
          form: body.form,
          inn: body.inn.toString(),
          kpp: body.kpp.toString(),
          ogrn: body.ogrn.toString(),
          physicalAddress: body.physicalAddress,
          isPhysicalAddressEq: body.isPhysicalAddressEq,
          legalAddress,
          mailAddress,
          isMailAddressEq: body.isMailAddressEq,
          phone: body.phone,
          email: body.email,
          bankAccountId: bankAccount?.id,
        },
        include: {
          bankAccount: true,
        },
      });

      return legalEntity;
    });

    return ts;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлении юр. лица",
    });
  }
});

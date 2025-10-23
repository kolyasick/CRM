import prisma from "~/lib/prisma";
import type { Counterparty } from "@prisma/client";
import type { CounterParty } from "~/types/project";

export default defineEventHandler(async (event) => {
  const { data, inn, id } = await readBody<{ data: any[]; inn: any; id: any }>(event);
  try {
    if (data) {
      const results = await prisma.$transaction(
        async (prisma) => {
          const createdCounterparties = [];
          for (const counterpartyData of data) {
            const isCPEXIST = await prisma.counterparty.findMany({
              where: {
                inn: counterpartyData.inn,
              },
            });
            if (isCPEXIST.length <= 0) {
              const bankAccount = counterpartyData.banckAccount.title
                ? await prisma.bankAccount.create({
                    data: {
                      title: counterpartyData.banckAccount.title,
                      bik: counterpartyData.banckAccount.bik ?? null,
                      accountNumber: counterpartyData.banckAccount.accountNumber,
                      cAccount: counterpartyData.banckAccount.cAccount,
                      address: counterpartyData.banckAccount.address,
                      city: counterpartyData.banckAccount.city,
                    },
                  })
                : null;
              const counterparty = await prisma.counterparty.create({
                data: {
                  title: counterpartyData.title,
                  comment: counterpartyData.comment,
                  form: counterpartyData.form,
                  inn: counterpartyData.inn,
                  kpp: counterpartyData.kpp,
                  ogrn: counterpartyData.ogrn ?? null,
                  physicalAddress: counterpartyData.physicalAddress,
                  legalAddress: counterpartyData.legalAddress,
                  isPhysicalAddressEq: counterpartyData.isPhysicalAddressEq,
                  mailAddress: counterpartyData.mailAddress,
                  isMailAddressEq: counterpartyData.isMailAddressEq,
                  phone: counterpartyData.phone,
                  email: counterpartyData.email,
                  isContractor: counterpartyData.isContractor,
                  isAgreed: true,
                  bankAccount: bankAccount ? { connect: { id: bankAccount.id } } : undefined,
                  id: generateRandomString(),
                  legalEntity: { connect: { inn } },
                },
              });
              if (counterpartyData.counterparty_contact && counterpartyData.counterparty_contact.title) {
                await prisma.counterparty_contact.create({
                  data: {
                    title: counterpartyData.counterparty_contact.title,
                    position: counterpartyData.counterparty_contact.position,
                    contact: counterpartyData.counterparty_contact.contact ?? "-",
                    counterparty_id: counterparty.id,
                  },
                });
              }
              createdCounterparties.push(counterparty);
            }
          }
          console.log(`Успешно создано ${createdCounterparties.length} записей контрагентов`);
          return createdCounterparties;
        },
        {
          timeout: 1200000,
        }
      );
    }
  } catch (error) {
    console.log("Ошибка при добавлении контрагента", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлении контрагента",
    });
  }
});

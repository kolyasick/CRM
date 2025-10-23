import { Counterparty_contact, BankAccount } from "@prisma/client";
import type { Counterparty } from "@prisma/client";
import prisma from "~/lib/prisma";

type Body = Omit<Counterparty, "id"> & {
  contacts: Counterparty_contact[];
  new_contacts: Omit<Counterparty_contact, "id">[];
  removed_contact_ids: number[];
  bankAccount: {
    title: string;
    bik: number;
    accountNumber: number;
    cAccount: number;
    city: string;
    address: string;
  } | null;
};

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const body = await readBody<Body>(event);

  if (!body.title) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    const legalAddress = body.isPhysicalAddressEq ? body.physicalAddress : body.legalAddress;
    const mailAddress = body.isMailAddressEq ? legalAddress! : body.mailAddress;

    const ts = await prisma.$transaction(async (tx) => {
      const bankAccount = body.bankAccount?.bik
        ? await tx.bankAccount.create({
            data: {
              title: body.bankAccount.title,
              bik: String(body.bankAccount.bik),
              accountNumber: String(body.bankAccount.accountNumber),
              cAccount: String(body.bankAccount.cAccount),
              address: body.bankAccount.address || "-",
              city: body.bankAccount.city || "-",
            },
          })
        : null;

      const counterparty = await tx.counterparty.create({
        data: {
          id: generateRandomString(),
          title: body.title,
          comment: body.comment || "",
          lawyerComment: body.lawyerComment || "",
          legalEntityId: body.legalEntityId,
          form: String(body.form),
          inn: String(body.inn) || "",
          kpp: String(body.kpp) || "",
          ogrn: String(body.ogrn) || "",
          physicalAddress: body.physicalAddress || "",
          isPhysicalAddressEq: body.isPhysicalAddressEq || true,
          legalAddress: legalAddress || "",
          isAgreed: body.isAgreed || false,
          mailAddress: mailAddress || "",
          isMailAddressEq: body.isMailAddressEq || true,
          phone: body.phone || "",
          email: body.email || "",
          managerId: user?.id,
          isContractor: body.isContractor || false,
          bankAccountId: bankAccount?.id,
          counterparty_contact: {
            create: body.new_contacts.map((contact) => ({
              title: contact.title,
              position: contact.position,
              contact: contact.contact,
            })),
          },
        },
        include: {
          counterparty_contact: true,
          project: true,
          bankAccount: true,
          legalEntity: true,
          manager: {
            select: {
              id: true,
              realEmail: true,
            },
          },
        },
      });

      return counterparty;
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Добавил нового контрагента "${ts.title}"`,
          statusCode: event.node.res.statusCode,
          link: "/counterparties?id=" + ts.id,
          userId: user!.id,
        },
      });
    }

    return ts;
  } catch (error) {
    console.log("Ошибка при добавлении контрагента", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлении контрагента",
    });
  }
});

import { Counterparty, Counterparty_contact } from "@prisma/client";
import prisma from "~/lib/prisma";

type Body = Counterparty & {
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
  };
};

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id as string;
  const body = await readBody<Body>(event);
  const { user } = await getUserSession(event);

  if (!user || (user.role !== "ADMIN" && user.role !== "LAWYER")) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  if (!body.title || !body.bankAccount) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    const legalAddress = body.isPhysicalAddressEq ? body.physicalAddress : body.legalAddress;
    const mailAddress = body.isMailAddressEq ? legalAddress! : body.mailAddress;

    const ts = await prisma.$transaction(async (tx) => {
      const bankAccount = body.bankAccountId
        ? await tx.bankAccount.update({
            where: { id: body.bankAccountId },
            data: {
              title: body.bankAccount.title,
              bik: String(body.bankAccount.bik),
              accountNumber: String(body.bankAccount.accountNumber),
              cAccount: String(body.bankAccount.cAccount),
              address: body.bankAccount.address,
              city: body.bankAccount.city,
            },
          })
        : await tx.bankAccount.create({
            data: {
              title: body.bankAccount.title,
              bik: String(body.bankAccount.bik),
              accountNumber: String(body.bankAccount.accountNumber),
              cAccount: String(body.bankAccount.cAccount),
              address: body.bankAccount.address,
              city: body.bankAccount.city,
            },
          });

      const counterparty = await tx.counterparty.update({
        where: { id },
        data: {
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
          mailAddress: mailAddress || "",
          isMailAddressEq: body.isMailAddressEq || true,
          phone: body.phone || "",
          email: body.email || "",
          isContractor: body.isContractor || false,
          bankAccountId: bankAccount?.id,
          counterparty_contact: {
            deleteMany: {
              id: {
                in: body.removed_contact_ids,
              },
            },
            create: body.new_contacts.map((contact: Omit<Counterparty_contact, "id">) => ({
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
        },
      });

      return counterparty;
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `${ts.isAgreed ? "Добавил комментарий к контрагенту" : "Редактировал контрагента"} "${ts.title}"`,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return ts;
  } catch (error) {
    console.error("Error updating counterparty:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update counterparty",
    });
  }
});

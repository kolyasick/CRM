import prisma from "~/lib/prisma";
import { dateString } from "~/utils/dateString";

type Response = {
  results: {
    [key: string]: string;
  };
};

const BASES_TO_TRACK = [""];

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  // async function getCounterPartiesFromAllBases() {
  //   let totalCreated = 0;

  //   for (const { apiName, inn } of BASES_TO_TRACK) {
  //     try {
  //       console.log(`Запрашиваю данные из базы ${apiName}...`);

  //       const data = await $fetch<any[]>(`${config.public.API_URL}/${apiName}/hs/hapi/v1/counteragent`);

  //       const transformed = data.map((c: any) => ({
  //         title: c.mainConteragentName,
  //         comment: c.comment,
  //         form: c.fizUr,
  //         inn: c.inn,
  //         kpp: c.kpp,
  //         ogrn: c.regNum,
  //         physicalAddress: c.contact["Фактический_адрес"] ?? "",
  //         legalAddress: c.contact["Юридический_адрес"] ?? null,
  //         isPhysicalAddressEq: c.contact["Юридический_адрес"] === c.contact["Фактический_адрес"],
  //         mailAddress: c.contact["Почтовый_адрес"] ?? "",
  //         isMailAddressEq: c.contact["Юридический_адрес"] === c.contact["Почтовый_адрес"],
  //         phone: c.contact["Телефон"] ?? "",
  //         email: c.contact["Email"] ?? "",
  //         isContractor: false,
  //         isAgreed: false,
  //         banckAccount: {
  //           title: c.bank_account.name,
  //           bik: c.bank_account.bik,
  //           accountNumber: c.bank_account.account,
  //           cAccount: c.bank_account.c_account,
  //           address: c.bank_account.address,
  //           city: c.bank_account.city,
  //         },
  //         counterparty_contact: {
  //           title: `${c.contact_person.last_name} ${c.contact_person.first_name} ${c.contact_person.third_name}`,
  //           position: c.contact_person.position,
  //           contact: `${c.contact_person.contact["Телефон_мобильный"] ?? ""}\n${c.contact_person.contact["Email"] ?? ""}`,
  //         },
  //       }));
  //       if (transformed) {
  //         const results = await prisma.$transaction(
  //           async (prisma) => {
  //             const createdCounterparties = [];
  //             for (const counterpartyData of transformed) {
  //               const isCPEXIST = await prisma.counterparty.findMany({
  //                 where: {
  //                   inn: counterpartyData.inn,
  //                 },
  //               });
  //               if (isCPEXIST.length <= 0) {
  //                 const bankAccount = counterpartyData.banckAccount.title
  //                   ? await prisma.bankAccount.create({
  //                       data: {
  //                         title: counterpartyData.banckAccount.title,
  //                         bik: counterpartyData.banckAccount.bik ?? null,
  //                         accountNumber: counterpartyData.banckAccount.accountNumber,
  //                         cAccount: counterpartyData.banckAccount.cAccount,
  //                         address: counterpartyData.banckAccount.address,
  //                         city: counterpartyData.banckAccount.city,
  //                       },
  //                     })
  //                   : null;
  //                 const counterparty = await prisma.counterparty.create({
  //                   data: {
  //                     title: counterpartyData.title,
  //                     comment: counterpartyData.comment,
  //                     form: counterpartyData.form,
  //                     inn: counterpartyData.inn,
  //                     kpp: counterpartyData.kpp,
  //                     ogrn: counterpartyData.ogrn ?? null,
  //                     physicalAddress: counterpartyData.physicalAddress,
  //                     legalAddress: counterpartyData.legalAddress,
  //                     isPhysicalAddressEq: counterpartyData.isPhysicalAddressEq,
  //                     mailAddress: counterpartyData.mailAddress,
  //                     isMailAddressEq: counterpartyData.isMailAddressEq,
  //                     phone: counterpartyData.phone,
  //                     email: counterpartyData.email,
  //                     isContractor: counterpartyData.isContractor,
  //                     isAgreed: true,
  //                     bankAccount: bankAccount ? { connect: { id: bankAccount.id } } : undefined,
  //                     id: generateRandomString(),
  //                     legalEntity: { connect: { inn } },
  //                   },
  //                 });
  //                 if (counterpartyData.counterparty_contact && counterpartyData.counterparty_contact.title) {
  //                   await prisma.counterparty_contact.create({
  //                     data: {
  //                       title: counterpartyData.counterparty_contact.title,
  //                       position: counterpartyData.counterparty_contact.position,
  //                       contact: counterpartyData.counterparty_contact.contact ?? "-",
  //                       counterparty_id: counterparty.id,
  //                     },
  //                   });
  //                 }
  //                 createdCounterparties.push(counterparty);
  //               }
  //             }
  //             console.log(`Успешно создано ${createdCounterparties.length} записей контрагентов`);
  //             return createdCounterparties;
  //           },
  //           {
  //             timeout: 1200000,
  //           }
  //         );
  //       }
  //     } catch (error) {
  //       console.error(`Ошибка при обработке базы ${apiName}:`, error);
  //     }
  //   }

  //   console.log(`Всего создано ${totalCreated} записей контрагентов из всех баз`);
  // }

  // const trackPayments = async (baseName: string) => {
  //   try {
  //     const payments = await prisma.application.findMany({
  //       where: {
  //         isIncome: false,
  //         adminStatus: {
  //           title: "Согласовано",
  //         },
  //         isPayed: false,
  //         payStatus: { title: { not: "Оплачен" } },
  //       },
  //       select: {
  //         id: true,
  //         accountDate: true,
  //         legalEntity: {
  //           select: {
  //             dbName: true,
  //           },
  //         },
  //       },
  //     });

  //     if (!payments.length || !payments.some((p) => p.legalEntity.dbName === baseName)) return;

  //     const response = await fetch(`${config.public.API_URL}/${baseName}/hs/hapi/v1/track-payments`, {
  //       method: "POST",
  //       body: JSON.stringify({
  //         payment_numbers: payments.map((p) => ({
  //           Номер: p.id.toString(),
  //           Дата: dateString(new Date(p.accountDate)),
  //         })),
  //       }),
  //     });

  //     const result: Response = await response.json();
  //     for (const [id, status] of Object.entries(result.results)) {
  //       const app = await prisma.application.findUnique({
  //         where: {
  //           id: parseInt(id),
  //           legalEntity: {
  //             dbName: baseName,
  //           },
  //           payStatus: {
  //             title: {
  //               not: status,
  //             },
  //           },
  //         },
  //         select: {
  //           id: true,
  //           isPayed: true,
  //           title: true,
  //           sum: true,
  //           projects: {
  //             select: {
  //               project: {
  //                 select: {
  //                   manager: {
  //                     select: {
  //                       realEmail: true,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       });

  //       if (!app) continue;

  //       await prisma.application.update({
  //         where: {
  //           id: app.id,
  //         },
  //         data: {
  //           payStatus: {
  //             connectOrCreate: {
  //               where: {
  //                 title: status,
  //               },
  //               create: {
  //                 title: status,
  //               },
  //             },
  //           },
  //         },
  //         select: {
  //           sum: true,
  //         },
  //       });
  //       console.log(`[${baseName}] Статусы платежей обновлены:`, result);

  //       if (status === "Оплачен" && !app.isPayed) {
  //         await prisma.$transaction([
  //           prisma.application.update({
  //             where: { id: app.id },
  //             data: { isPayed: true, paymentDate: new Date() },
  //           }),

  //           prisma.primaryDocument.update({
  //             where: {
  //               applicationId: app.id,
  //             },
  //             data: {
  //               paymentDate: new Date(),
  //             },
  //           }),
  //         ]);

  //         const mailOptions = {
  //           from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
  //           to: app.projects[0].project.manager.realEmail,
  //           subject: `✅ Заявка на оплату №${app.id} успешно оплачена`,
  //           text: `✅ Ваша заявка на оплату №${app.id} успешно оплачена\n\n🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${app.id}\n   • Обычная ссылка: ${config.public.APP_URL}/applications?id=${app.id}`,
  //           html: `
  //             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  //               <div style="text-align: center; margin-bottom: 20px;">
  //                 <h1 style="color: #27ae60; margin: 0; padding: 10px 0; border-bottom: 2px solid #27ae60;">
  //                   ✅ Оплата успешно завершена
  //                 </h1>
  //               </div>
                
  //               <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
  //                 <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
  //                 <p style="font-size: 20px; color: #155724; margin: 0; font-weight: bold;">
  //                   Ваша заявка на оплату №${app.id}<br>
  //                   успешно оплачена!
  //                 </p>
  //               </div>

  //               <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //                 <h3 style="color: #2980b9; margin-top: 0; text-align: center;">📋 Детали заявки</h3>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
  //                   <p style="margin: 8px 0; color: #2c3e50;">
  //                     <strong>№ заявки:</strong> ${app.id}
  //                   </p>
  //                   ${app.title ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>Название:</strong> ${app.title}</p>` : ""}
  //                   ${app.sum ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>Сумма:</strong> ${app.sum} руб.</p>` : ""}
  //                   <p style="margin: 8px 0; color: #2c3e50;">
  //                     <strong>Статус:</strong> <span style="color: #27ae60; font-weight: bold;">✅ Оплачено</span>
  //                   </p>
  //                 </div>
  //               </div>

  //               <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //                 <h3 style="color: #2980b9; margin-top: 0; text-align: center;">🔗 Ссылка на заявку</h3>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
  //                   <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
  //                     🖥️ Для удаленного рабочего стола:
  //                   </p>
  //                   <p style="margin: 8px 0;">
  //                     <a href="http://localhost:1823/applications?id=${app.id}" 
  //                       style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
  //                       http://localhost:1823/applications?id=${app.id}
  //                     </a>
  //                   </p>
  //                 </div>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
  //                   <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
  //                     🌐 Обычная ссылка:
  //                   </p>
  //                   <p style="margin: 8px 0;">
  //                     <a href="${config.public.APP_URL}/applications?id=${app.id}" 
  //                       style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
  //                       ${config.public.APP_URL}/applications?id=${app.id}
  //                     </a>
  //                   </p>
  //                 </div>
  //               </div>

  //               <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
  //                 <p style="color: #155724; margin: 0; font-weight: bold;">
  //                   💼 Операция завершена успешно. Заявка переведена в статус "Оплачено"
  //                 </p>
  //               </div>
  //             </div>`,
  //         };

  //         await $fetch("/api/mailer/send-mail", {
  //           method: "POST",
  //           body: { mailOptions },
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error(`[${baseName}] Ошибка при обновлении статусов платежей:`, error);
  //   }
  // };

  // const trackInvoices = async (baseName: string) => {
  //   try {
  //     const invoices = await prisma.application.findMany({
  //       where: {
  //         isIncome: true,
  //         adminStatus: {
  //           title: "Согласовано",
  //         },
  //         isPayed: false,
  //         payStatus: { title: { not: "Оплачен" } },
  //       },
  //       select: {
  //         id: true,
  //         accountDate: true,
  //         legalEntity: {
  //           select: {
  //             dbName: true,
  //           },
  //         },
  //       },
  //     });

  //     if (!invoices.length || !invoices.some((i) => i.legalEntity.dbName === baseName)) return;

  //     const response = await fetch(`${config.public.API_URL}/${baseName}/hs/hapi/v1/track-invoices`, {
  //       method: "POST",
  //       body: JSON.stringify({
  //         invoice_numbers: invoices.map((i) => ({
  //           Номер: i.id.toString(),
  //           Дата: dateString(new Date(i.accountDate)),
  //         })),
  //       }),
  //     });

  //     const result: Response = await response.json();

  //     for (const [id, status] of Object.entries(result.results)) {
  //       const app = await prisma.application.findUnique({
  //         where: {
  //           id: parseInt(id),
  //           legalEntity: {
  //             dbName: baseName,
  //           },
  //           payStatus: {
  //             title: {
  //               not: status,
  //             },
  //           },
  //         },
  //         select: {
  //           id: true,
  //           isPayed: true,
  //           title: true,
  //           sum: true,
  //           projects: {
  //             select: {
  //               project: {
  //                 select: {
  //                   manager: {
  //                     select: {
  //                       realEmail: true,
  //                     },
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       });

  //       if (!app) continue;

  //       const { sum } = await prisma.application.update({
  //         where: {
  //           id: app.id,
  //         },
  //         data: {
  //           payStatus: {
  //             connectOrCreate: {
  //               where: {
  //                 title: status,
  //               },
  //               create: {
  //                 title: status,
  //               },
  //             },
  //           },
  //         },
  //         select: {
  //           sum: true,
  //         },
  //       });
  //       console.log(`[${baseName}] Статусы счетов обновлены:`, result);

  //       if (status === "Оплачен" && !app.isPayed) {
  //         await prisma.$transaction([
  //           prisma.application.update({
  //             where: { id: app.id },
  //             data: { isPayed: true, accountDate: new Date() },
  //           }),
  //           prisma.project.updateMany({
  //             where: {
  //               applications: {
  //                 some: {
  //                   applicationId: parseInt(id),
  //                 },
  //               },
  //             },
  //             data: {
  //               payed_sum: {
  //                 increment: sum,
  //               },
  //             },
  //           }),
  //         ]);

  //         const mailOptions = {
  //           from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
  //           to: app.projects[0].project.manager.realEmail,
  //           subject: `✅ Ваш счет №${app.id} успешно оплачен`,
  //           text: `✅ Ваш счет на оплату №${app.id} успешно оплачен\n\n🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${app.id}\n   • Обычная ссылка: ${config.public.APP_URL}/applications?id=${app.id}`,
  //           html: `
  //             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  //               <div style="text-align: center; margin-bottom: 20px;">
  //                 <h1 style="color: #27ae60; margin: 0; padding: 10px 0; border-bottom: 2px solid #27ae60;">
  //                   ✅ Оплата успешно завершена
  //                 </h1>
  //               </div>
                
  //               <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
  //                 <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
  //                 <p style="font-size: 20px; color: #155724; margin: 0; font-weight: bold;">
  //                   Ваш счет на оплату №${app.id}<br>
  //                   успешно оплачен!
  //                 </p>
  //               </div>

  //               <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //                 <h3 style="color: #2980b9; margin-top: 0; text-align: center;">📋 Детали заявки</h3>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
  //                   <p style="margin: 8px 0; color: #2c3e50;">
  //                     <strong>№ заявки:</strong> ${app.id}
  //                   </p>
  //                   ${app.title ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>Название:</strong> ${app.title}</p>` : ""}
  //                   ${app.sum ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>Сумма:</strong> ${app.sum} руб.</p>` : ""}
  //                   <p style="margin: 8px 0; color: #2c3e50;">
  //                     <strong>Статус:</strong> <span style="color: #27ae60; font-weight: bold;">✅ Оплачено</span>
  //                   </p>
  //                 </div>
  //               </div>

  //               <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
  //                 <h3 style="color: #2980b9; margin-top: 0; text-align: center;">🔗 Ссылка на заявку</h3>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
  //                   <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
  //                     🖥️ Для удаленного рабочего стола:
  //                   </p>
  //                   <p style="margin: 8px 0;">
  //                     <a href="http://localhost:1823/applications?id=${app.id}" 
  //                       style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
  //                       http://localhost:1823/applications?id=${app.id}
  //                     </a>
  //                   </p>
  //                 </div>
                  
  //                 <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
  //                   <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
  //                     🌐 Обычная ссылка:
  //                   </p>
  //                   <p style="margin: 8px 0;">
  //                     <a href="${config.public.APP_URL}/applications?id=${app.id}" 
  //                       style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
  //                       ${config.public.APP_URL}/applications?id=${app.id}
  //                     </a>
  //                   </p>
  //                 </div>
  //               </div>

  //               <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
  //                 <p style="color: #155724; margin: 0; font-weight: bold;">
  //                   💼 Операция завершена успешно. Заявка переведена в статус "Оплачено"
  //                 </p>
  //               </div>
  //             </div>`,
  //         };

  //         await $fetch("/api/mailer/send-mail", {
  //           method: "POST",
  //           body: { mailOptions },
  //         });
  //       }
  //     }
  //   } catch (error) {
  //     console.error(`[${baseName}] Ошибка при обновлении статусов счетов:`, error);
  //   }
  // };

  // const trackPrimaryDocuments = async () => {
  //   try {
  //     const documents = await prisma.primaryDocument.findMany({
  //       where: {
  //         AND: [
  //           {
  //             isEmailed: false,
  //           },
  //           {
  //             status: {
  //               not: "Предоставлен",
  //             },
  //           },
  //           {
  //             provisionDeadline: {
  //               gte: new Date(),
  //               lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  //             },
  //           },
  //         ],
  //       },
  //       include: {
  //         manager: {
  //           select: {
  //             realEmail: true,
  //             full_name: true,
  //           },
  //         },
  //         project: {
  //           select: {
  //             title: true,
  //           },
  //         },
  //         legalEntity: {
  //           select: {
  //             title: true,
  //           },
  //         },
  //         counterParty: {
  //           select: {
  //             title: true,
  //           },
  //         },
  //       },
  //     });

  //     const documentsByManager = documents.reduce((acc, doc) => {
  //       if (doc.manager?.realEmail) {
  //         if (!acc[doc.manager.realEmail]) {
  //           acc[doc.manager.realEmail] = {
  //             manager: doc.manager,
  //             documents: [],
  //           };
  //         }
  //         acc[doc.manager.realEmail].documents.push(doc);
  //       }
  //       return acc;
  //     }, {} as { [email: string]: { manager: any; documents: any[] } });

  //     for (const [email, data] of Object.entries(documentsByManager)) {
  //       const managerData = data as { manager: any; documents: any[] };

  //       const documentList = managerData.documents
  //         .map(
  //           (doc) => `
  //             <tr>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${doc.invoiceNumber}</td>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${doc.project?.title || "Не указан"}</td>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${doc.counterParty?.title || "Не указан"}</td>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${doc.legalEntity?.title || "Не указан"}</td>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${new Date(doc.provisionDeadline).toLocaleDateString("ru-RU")}</td>
  //               <td style="padding: 8px; border: 1px solid #ddd;">${doc.amount ? `${doc.amount.toLocaleString("ru-RU")} руб.` : "Не указана"}</td>
  //             </tr>
  //           `
  //         )
  //         .join("");

  //       const mailOptions = {
  //         from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
  //         to: email,
  //         subject: `⏰ Срочно! Необходимо предоставить документы по ${managerData.documents.length} счетам`,
  //         text: `Уважаемый(ая) ${managerData.manager.full_name}!

  //         Необходимо предоставить документы по следующим счетам (до истечения срока осталась неделя или менее):

  //         ${managerData.documents
  //           .map(
  //             (doc) =>
  //               `• Счет №${doc.invoiceNumber} (${doc.project?.title || "Проект не указан"}) - срок до ${new Date(
  //                 doc.provisionDeadline
  //               ).toLocaleDateString("ru-RU")}`
  //           )
  //           .join("\n")}

  //         Пожалуйста, предоставьте необходимые документы в указанные сроки.`,

  //         html: `
  //           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  //             <h2 style="color: #dc2626;">⏰ Срочно! Необходимо предоставить документы</h2>
              
  //             <p>Уважаемый(ая) <strong>${managerData.manager.full_name}</strong>,</p>
              
  //             <p>По следующим счетам необходимо предоставить документы. До истечения срока осталась <strong>неделя или менее</strong>:</p>
              
  //             <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  //               <thead>
  //                 <tr style="background-color: #f3f4f6;">
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">№ счета</th>
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Проект</th>
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Контрагент</th>
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Фирма</th>
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Срок предоставления</th>
  //                   <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Сумма</th>
  //                 </tr>
  //               </thead>
  //               <tbody>
  //                 ${documentList}
  //               </tbody>
  //             </table>
              
  //             <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 4px; margin: 20px 0;">
  //               <p style="margin: 0; color: #dc2626;"><strong>⚠️ Внимание!</strong> Пожалуйста, предоставьте необходимые документы в указанные сроки во избежание проблем с отчетностью.</p>
  //             </div>
  //           </div>
  //               `,
  //       };

  //       try {
  //         await $fetch("/api/mailer/send-mail", {
  //           method: "POST",
  //           body: { mailOptions },
  //         });
  //         await prisma.primaryDocument.updateMany({
  //           where: {
  //             id: {
  //               in: managerData.documents.map((doc) => doc.id),
  //             },
  //           },
  //           data: {
  //             isEmailed: true,
  //           },
  //         });

  //         console.log(`✅ Email отправлен менеджеру ${managerData.manager.full_name} (${email})`);
  //       } catch (error) {
  //         console.error(`❌ Ошибка отправки email менеджеру ${managerData.manager.full_name}:`, error);
  //       }
  //     }

  //     console.log(`📧 Отправлено уведомлений: ${Object.keys(documentsByManager).length} менеджерам`);
  //   } catch (error) {
  //     console.log("Ошибка при обновлении статусов ПД: ", error);
  //   }
  // };

  // const runTrackingForAllBases = async () => {
  //   for (const baseName of BASES_TO_TRACK) {
  //     await trackPayments(baseName.apiName);
  //     await trackInvoices(baseName.apiName);
  //   }
  // };

  // await runTrackingForAllBases();
  // if (process.env.NODE_ENV === "deployment") {
  //   await getCounterPartiesFromAllBases();
  // }

  // setInterval(runTrackingForAllBases, 1000 * 60 * 30);
  // setInterval(getCounterPartiesFromAllBases, 1000 * 60 * 60 * 1);
  // setInterval(trackPrimaryDocuments, 1000 * 60 * 60 * 3);
});

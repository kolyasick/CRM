import type { Legal_entity } from "@prisma/client";
import type { CounterParty, IApplication, IProject } from "~/types/project";

export const useGeneralStore = defineStore("general", () => {
  const { public: config } = useRuntimeConfig();
  const {
    generateInvoiceHTML,
    generateInvoiceText,
    generateNewProjectHTML,
    generateNewProjectText,
    generatePaymentHTML,
    generatePaymentRequestHTML,
    generatePaymentRequestText,
    generatePaymentText,
  } = useEmailStore();


  const entities = ref<Legal_entity[]>([]);
  const projects = ref<IProject[]>([]);

  const LAWYER_EMAILS: string[] = process.env.NODE_ENV === "development" ? config.MY_EMAIL : config.LAWYER_EMAILS;
  const EMAILS: string[] = process.env.NODE_ENV === "development" ? config.MY_EMAIL : config.ACCOUNTANT_EMAILS;

  async function getEntities() {
    const e = await $fetch<Legal_entity[]>("/api/legal_entity", { query: { onlySelect: true } });
    const p = await $fetch<IProject[]>("/api/project?onlySearch=true");
    if (e) entities.value = e;
    if (p) projects.value = p;
  }

  function switchBody(val: boolean) {
    document.body.style.overflowY = val ? "hidden" : "auto";
  }

  

  async function saveApplication(applicationData: Omit<IApplication, "id"> | IApplication) {
    const { addNotification } = useNotification();
    const legalEntity = entities.value.find((e) => e.id === applicationData.legalEntityId);

    try {
      if (applicationData.legalEntityId !== applicationData.counterparty?.legalEntityId) {
        const newId = await createCounterParty(
          { ...applicationData.counterparty!, legalEntityId: applicationData.legalEntityId },
          legalEntity?.dbName!
        );
        if (!newId) {
          addNotification("Ошибка при создании нового контрагента", "error", null);
          return;
        }
        applicationData.counterpartyId = newId;
      }

      if ("id" in applicationData) {
        const response = await $fetch<IApplication>(`/api/application/${applicationData.id}`, {
          method: "PATCH",
          body: {
            ...applicationData,
            taxPercent: applicationData.isIncome ? legalEntity?.tax : 0,
          },
        });

        return response;
      } else {
        const response = await $fetch<IApplication>(`/api/application`, {
          method: "POST",
          body: {
            ...applicationData,
            taxPercent: applicationData.isIncome ? legalEntity?.tax : 0,
          },
        });

        if (applicationData.isIncome) {
          let title = "";
          if (applicationData.accountNumber && applicationData.accountDate) {
            title =
              (response.title.includes("счет") ? "Счет " : "Договор ") + // @ts-ignore
              `№${applicationData.accountNumber} от ${new Date(applicationData.accountDate).toISOString().split("T")[0]} за ${applicationData.for}`;
          } else {
            title = applicationData.title;
          }

          // const body = {
          //   Номер: response.id,
          //   НомерДоговора: applicationData.accountNumber,
          //   ДатаДоговора: dateString(applicationData.accountDate),
          //   Дата: dateString(new Date()),
          //   Контрагент: applicationData.counterparty?.inn,
          //   Договор: title,
          //   Проводить: false,
          //   Организация: legalEntity?.inn.toString(),
          //   НДС: legalEntity?.tax,
          //   Комментарий: applicationData.comment || applicationData.project?.title + ", " + applicationData.project?.manager?.full_name,
          //   Товары: applicationData.positions?.map((p) => ({
          //     Тип: "Услуга",
          //     Наименование: p.title,
          //     Количество: p.qty,
          //     Единица: p.unit,
          //     Содержание: "Без содержания",
          //     Цена: p.price,
          //   })),
          // };
          // const res = await fetch(`${config.API_URL}/${legalEntity?.dbName}/hs/hapi/v1/create-invoice`, {
          //   method: "POST",
          //   body: JSON.stringify(body),
          // });
          // const result = await res.json();

          // if (result["Ошибка"]) {
          //   await $fetch(`/api/application/${response.id}`, { method: "DELETE" });
          //   addNotification("Ошибка при изменении статуса: " + result["Ошибка"], "error", null);
          //   return null;
          // }

          // @ts-ignore
          await sendStatusEmail("invoice", response, response.project?.manager?.full_name);
        } else {
          const mailOptions = {
            from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
            to: response.moderator?.realEmail,
            subject: `📋 Требуется согласование заявки на оплату: "${response.title}" №${response.id}`,
            text: `📋 Нужно согласовать новую заявку на оплату "${response.title}" №${response.id}\n\n🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${response.id}\n   • Обычная ссылка: ${config.APP_URL}/applications?id=${response.id}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #e67e22; margin: 0; padding: 10px 0; border-bottom: 2px solid #e67e22;">
                    ⚡ Требуется согласование
                  </h1>
                </div>
                
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="font-size: 18px; color: #856404; margin: 0 0 15px 0;">
                    <strong>Создана новая заявка на оплату, требующая вашего согласования</strong>
                  </p>
                  <div style="background: white; padding: 15px; border-radius: 6px; display: inline-block;">
                    <p style="font-size: 20px; color: #e67e22; margin: 0; font-weight: bold;">
                      "${response.title}"
                    </p>
                    <p style="color: #7f8c8d; margin: 5px 0 0 0;">
                      №${response.id}
                    </p>
                  </div>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #495057; margin-top: 0; text-align: center;">📊 Информация о заявке</h3>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <p style="margin: 8px 0; color: #2c3e50;">
                      <strong>📋 Номер:</strong> ${response.id}
                    </p>
                    <p style="margin: 8px 0; color: #2c3e50;">
                      <strong>📝 Название:</strong> ${response.title}
                    </p>
                    ${response.sum ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>💰 Сумма:</strong> ${response.sum} руб.</p>` : ""}
                    <p style="margin: 8px 0; color: #2c3e50;">
                      <strong>🔄 Статус:</strong> <span style="color: #e67e22; font-weight: bold;">⏳ Ожидает согласования</span>
                    </p>
                  </div>
                </div>

                <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #2980b9; margin-top: 0; text-align: center;">🔗 Перейти к согласованию</h3>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e67e22;">
                    <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                      🖥️ Для удаленного рабочего стола:
                    </p>
                    <p style="margin: 8px 0;">
                      <a href="http://localhost:1823/applications?id=${response.id}" 
                        style="color: #e67e22; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #fdf6e3; border-radius: 4px; border: 1px solid #ffeaa7;">
                        http://localhost:1823/applications?id=${response.id}
                      </a>
                    </p>
                  </div>
                  
                  <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #e67e22;">
                    <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                      🌐 Обычная ссылка:
                    </p>
                    <p style="margin: 8px 0;">
                      <a href="${config.APP_URL}/applications?id=${response.id}" 
                        style="color: #e67e22; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #fdf6e3; border-radius: 4px; border: 1px solid #ffeaa7;">
                        ${config.APP_URL}/applications?id=${response.id}
                      </a>
                    </p>
                  </div>
                </div>

                ${
                  response.isUrgent
                    ? `<div style="background: #f8d7da; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                        <p style="color: #721c24; margin: 0; font-weight: bold;">
                          ⚠️ Срочное действие: необходимо согласовать заявку в кратчайшие сроки
                        </p>
                      </div>`
                    : ""
                }
              </div>`,
          };

          await $fetch("/api/mailer/send-mail", {
            method: "POST",
            body: { mailOptions },
          });
        }

        return response;
      }
    } catch (error: any) {
      addNotification("Ошибка: " + error, "error");
      console.log(error);
    }
  }

  async function createCounterParty(counterparty: CounterParty, dbName: string) {
    try {
      // await fetch(`${config.API_URL}/${dbName}/hs/hapi/v1/counteragent`, {
      //   method: "POST",
      //   body: JSON.stringify({
      //     Name: counterparty.title,
      //     FullName: counterparty.title,
      //     INN: counterparty.inn || "",
      //     KPP: counterparty.kpp || "",
      //     PostAddress: counterparty.mailAddress || "",
      //     LegalAddress: counterparty.legalAddress || "",
      //     ActualAddress: counterparty.physicalAddress || "",
      //     Phone: counterparty.phone || "",
      //     Email: counterparty.email || "",
      //     Type: counterparty.form || "",
      //     MainBankAccount: {
      //       BankName: counterparty.bankAccount?.title || "",
      //       BIK: counterparty.bankAccount?.bik || "",
      //       CorrespondentAccount: counterparty.bankAccount?.cAccount || "",
      //       AccountNumber: counterparty.bankAccount?.accountNumber || "",
      //       Address: counterparty.bankAccount?.address || "",
      //       City: counterparty.bankAccount?.city || "",
      //       Currency: "RUB",
      //       MainAccount: true,
      //     },
      //     ContactPersons: counterparty.counterparty_contact?.map((c) => ({
      //       Name: c.title,
      //       Position: c.position,
      //       Phone: c.contact,
      //       Email: c.contact,
      //     })),
      //     Note: counterparty.comment || "",
      //   }),
      // });
      const { counterparty_contact, ...counterPartData } = counterparty;
      const cp = await $fetch("/api/counterparty", {
        method: "POST",
        body: {
          ...counterPartData,
          isAgreed: true,
          new_contacts: counterparty.counterparty_contact || [],
        },
      });

      return cp?.id;
    } catch (error) {
      console.log(error);
    }
  }

  async function adminStatusChange(app: IApplication, status: string, manager: string = "Не указан") {
    const { addNotification } = useNotification();

    try {
      if (status === "Согласовано") {
        const endpoint = `${config.API_URL}/${app.legalEntity?.dbName}/hs/hapi/v1/create-payment`;

        let title: string = "";

        if (app.accountNumber && app.accountDate) {
          const appFor = app.title.toLowerCase().split("за")[app.title.toLowerCase().split("за").length - 1].trim() || "";
          title =
            (app.title.includes("счет") ? "Счет " : "Договор ") + // @ts-ignore
            `№${app.accountNumber} от ${new Date(app.accountDate).toISOString().split("T")[0]} за ${appFor}`;
        } else {
          title = app.title;
        }

        const body = {
          Номер: app.id,
          Срочно: app.isUrgent,
          Дата: dateString(new Date()),
          Сумма: app.sum,
          Контрагент: app.counterparty?.inn,
          НазначениеПлатежа: app.title,
          Договор: title,
          НомерДоговора: app.accountNumber,
          ДатаДоговора: dateString(app.accountDate),
          Проводить: false,
          Отправитель: app.legalEntity?.inn,
          Комментарий: app.comment || app.project?.title + ", " + app.project?.manager?.full_name,
        };

        // const response = await fetch(endpoint, {
        //   method: "POST",
        //   body: JSON.stringify(body),
        // });
        // const result = await response.json();

        // if (result["Ошибка"]) {
        //   addNotification("Ошибка при изменении статуса: " + result["Ошибка"], "error", null);
        //   return;
        // }
      }

      const application = await $fetch<IApplication>(`/api/application/${app.id}/admin`, {
        method: "PUT",
        body: { status },
      });

      const mailOptions = {
        from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
        to: app.project?.manager?.realEmail,
        subject: `✅ Согласована ваша заявка на оплату "${app.title}" №${application.id}`,
        text: `✅ Согласована ваша заявка на оплату "${app.title}" №${application.id}\n\n🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${app.id}\n   • Обычная ссылка: ${config.APP_URL}/applications?id=${app.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #27ae60; margin: 0; padding: 10px 0; border-bottom: 2px solid #27ae60;">
                ✅ Заявка согласована
              </h1>
            </div>
            
            <div style="background: #d4edda; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">👍</div>
              <p style="font-size: 20px; color: #155724; margin: 0; font-weight: bold;">
                Ваша заявка на оплату успешно согласована!
              </p>
            </div>

            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2980b9; margin-top: 0; text-align: center;">📋 Информация о заявке</h3>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                <p style="margin: 8px 0; color: #2c3e50;">
                  <strong>📋 Номер заявки:</strong> №${application.id}
                </p>
                <p style="margin: 8px 0; color: #2c3e50;">
                  <strong>📝 Название:</strong> "${app.title}"
                </p>
                ${app.sum ? `<p style="margin: 8px 0; color: #2c3e50;"><strong>💰 Сумма:</strong> ${app.sum} руб.</p>` : ""}
                <p style="margin: 8px 0; color: #2c3e50;">
                  <strong>🔄 Статус:</strong> <span style="color: #27ae60; font-weight: bold;">✅ Согласовано</span>
                </p>
              </div>
            </div>

            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2980b9; margin-top: 0; text-align: center;">🔗 Ссылка на заявку</h3>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
                <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                  🖥️ Для удаленного рабочего стола:
                </p>
                <p style="margin: 8px 0;">
                  <a href="http://localhost:1823/applications?id=${app.id}" 
                    style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
                    http://localhost:1823/applications?id=${app.id}
                  </a>
                </p>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #27ae60;">
                <p style="margin: 12px 0; font-weight: bold; color: #2c3e50;">
                  🌐 Обычная ссылка:
                </p>
                <p style="margin: 8px 0;">
                  <a href="${config.APP_URL}/applications?id=${app.id}" 
                    style="color: #3498db; text-decoration: none; word-break: break-all; display: inline-block; padding: 8px 12px; background: #f8f9fa; border-radius: 4px;">
                    ${config.APP_URL}/applications?id=${app.id}
                  </a>
                </p>
              </div>
            </div>

            <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
              <p style="color: #155724; margin: 0; font-weight: bold;">
                📋 Заявка переведена в статус "Согласовано" и ожидает дальнейших действий
              </p>
            </div>
          </div>`,
      };

      await $fetch("/api/mailer/send-mail", {
        method: "POST",
        body: { mailOptions },
      });
      await sendStatusEmail("payment", application, manager);

      return application;
    } catch (error) {
      console.error("Error approving application:", error);
      addNotification("Произошла ошибка при изменении статуса", "error");
    }
  }

  async function sendStatusEmail(type: string, application: IApplication | null, manager: string, project?: IProject) {
    try {
      const link = "5.19.137.120:1823";

      const baseMailOptions = {
        from: '"Магнат MCRM" <m.sergeev@lightdigital.ru>',
        to: EMAILS.join(", "),
      };

      let mailOptions = {};

      switch (type) {
        case "payment":
          if (application?.adminStatus?.title === "Согласовано") {
            mailOptions = {
              ...baseMailOptions,
              subject: `Новая заявка на оплату №${application.id}`,
              text: generatePaymentText(application, manager, link),
              html: generatePaymentHTML(application, manager, link),
            };
          }
          break;

        case "invoice":
          mailOptions = {
            ...baseMailOptions,
            subject: `Новый счёт контрагенту №${application?.id}`,
            text: generateInvoiceText(application!, manager, link),
            html: generateInvoiceHTML(application!, manager, link),
          };
          break;
        case "paymentRequest":
          mailOptions = {
            ...baseMailOptions,
            subject: `Запрос на предоставление П/П для заявки №${application?.id} (${application?.title})`,
            text: generatePaymentRequestText(application!, manager, link),
            html: generatePaymentRequestHTML(application!, manager, link),
          };
          break;

        case "newProject":
          mailOptions = {
            ...baseMailOptions,
            to: LAWYER_EMAILS.join(", "),
            subject: `Новый проект "${project?.title}"`,
            text: generateNewProjectText(project!, manager, link),
            html: generateNewProjectHTML(project!, manager, link),
          };
          break;

        default:
          console.warn(`Unknown email type: ${type}`);
          return;
      }

      if (Object.keys(mailOptions).length === 0) {
        console.log("No email to send for this type/status combination");
        return;
      }

      await $fetch("/api/mailer/send-mail", {
        method: "POST",
        body: { mailOptions },
      });

      console.log("Email отправлен успешно");
    } catch (error) {
      console.error("Ошибка при отправке email:", error);
      throw error;
    }
  }

  return {
    entities,
    projects,
    LAWYER_EMAILS,

    getEntities,
    saveApplication,
    adminStatusChange,
    createCounterParty,
    sendStatusEmail,
    switchBody,
    
  };
});

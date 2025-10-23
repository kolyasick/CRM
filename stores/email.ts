import type { IApplication, IProject } from "~/types/project";

export const useEmailStore = defineStore("email", () => {
  function generatePaymentText(application: IApplication, manager: string, link: string): string {
    return (
      `🏦 Новая заявка на оплату №${application.id}\n\n` +
      `👤 Контрагент: ${application.counterparty?.title || "не указан"}\n` +
      `📋 ИНН контрагента: ${application.counterparty?.inn || "не указан"}\n` +
      `🏢 Юр. лицо: ${application.legalEntity?.title || "не указан"}\n` +
      `💰 Сумма: ${application.sum || "не указана"} руб.\n` +
      (application.comment ? `💬 Комментарий: ${application.comment}\n` : "") +
      `\n👨‍💼 Ответственный: ${manager}\n\n` +
      (application.document
        ? `📎 Ссылка на файл:\n   • Для удаленного рабочего стола: http://localhost:1823/uploads/${application.document}\n   • Обычная ссылка: http://${link}/uploads/${application.document}\n\n`
        : "") +
      `🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${application.id}\n   • Обычная ссылка: http://${link}/applications?id=${application.id}`
    );
  }

  function generatePaymentHTML(application: IApplication, manager: string, link: string): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h1 style="color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
    🏦 Новая заявка на оплату №${application.id}
  </h1>
  
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
    ${application.counterparty?.title ? `<p style="margin: 8px 0;"><strong>👤 Контрагент:</strong> ${application.counterparty.title}</p>` : ""}
    ${application.counterparty?.inn ? `<p style="margin: 8px 0;"><strong>📋 ИНН контрагента:</strong> ${application.counterparty.inn}</p>` : ""}
    ${application.legalEntity?.title ? `<p style="margin: 8px 0;"><strong>🏢 Юр. лицо:</strong> ${application.legalEntity.title}</p>` : ""}
    ${application.sum ? `<p style="margin: 8px 0;"><strong>💰 Сумма:</strong> ${application.sum} руб.</p>` : ""}
    ${application.comment ? `<p style="margin: 8px 0;"><strong>💬 Комментарий:</strong> ${application.comment}</p>` : ""}
    <p style="margin: 8px 0;"><strong>👨‍💼 Ответственный:</strong> ${manager}</p>
  </div>

  ${
    application.document
      ? `<div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
         <h3 style="color: #2980b9; margin-top: 0;">📎 Ссылка на файл:</h3>
         <p style="margin: 8px 0;">
           • <a href="http://localhost:1823/uploads/${application.document}" style="color: #3498db; text-decoration: none;">
               Для удаленного рабочего стола
             </a>
         </p>
         <p style="margin: 8px 0;">
           • <a href="http://${link}/uploads/${application.document}" style="color: #3498db; text-decoration: none;">
               Обычная ссылка
             </a>
         </p>
       </div>`
      : ""
  }

  <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <h3 style="color: #2980b9; margin-top: 0;">🔗 Ссылка на заявку:</h3>
    <p style="margin: 8px 0;">
      • <a href="http://localhost:1823/applications?id=${application.id}" style="color: #3498db; text-decoration: none;">
          Для удаленного рабочего стола
        </a>
    </p>
    <p style="margin: 8px 0;">
      • <a href="http://${link}/applications?id=${application.id}" style="color: #3498db; text-decoration: none;">
          Обычная ссылка
        </a>
    </p>
  </div>
</div>`;
  }

  function generateInvoiceText(application: IApplication, manager: string, link: string): string {
    return (
      `📄 Новый счёт контрагенту №${application.id}\n\n` +
      `👤 Контрагент: ${application.counterparty?.title || "не указан"}\n` +
      `📋 ИНН контрагента: ${application.counterparty?.inn || "не указан"}\n` +
      `🏢 Юр. лицо: ${application.legalEntity?.title || "не указан"}\n` +
      `💰 Сумма: ${application.sum || "не указана"} руб.\n` +
      (application.comment ? `💬 Комментарий: ${application.comment}\n` : "") +
      `\n👨‍💼 Ответственный: ${manager}\n\n` +
      (application.document
        ? `📎 Ссылка на файл:\n   • Для удаленного рабочего стола: http://localhost:1823/uploads/${application.document}\n   • Обычная ссылка: http://${link}/uploads/${application.document}\n\n`
        : "") +
      `🔗 Ссылка на счет:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${application.id}\n   • Обычная ссылка: http://${link}/applications?id=${application.id}`
    );
  }

  function generateInvoiceHTML(application: IApplication, manager: string, link: string): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h1 style="color: #27ae60; text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
    📄 Новый счёт контрагенту №${application.id}
  </h1>
  
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
    ${application.counterparty?.title ? `<p style="margin: 8px 0;"><strong>👤 Контрагент:</strong> ${application.counterparty.title}</p>` : ""}
    ${application.counterparty?.inn ? `<p style="margin: 8px 0;"><strong>📋 ИНН контрагента:</strong> ${application.counterparty.inn}</p>` : ""}
    ${application.legalEntity?.title ? `<p style="margin: 8px 0;"><strong>🏢 Юр. лицо:</strong> ${application.legalEntity.title}</p>` : ""}
    ${application.sum ? `<p style="margin: 8px 0;"><strong>💰 Сумма:</strong> ${application.sum} руб.</p>` : ""}
    ${application.comment ? `<p style="margin: 8px 0;"><strong>💬 Комментарий:</strong> ${application.comment}</p>` : ""}
    <p style="margin: 8px 0;"><strong>👨‍💼 Ответственный:</strong> ${manager}</p>
  </div>

  ${
    application.document
      ? `<div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0;">
         <h3 style="color: #155724; margin-top: 0;">📎 Ссылка на файл:</h3>
         <p style="margin: 8px 0;">
           • <a href="http://localhost:1823/uploads/${application.document}" style="color: #28a745; text-decoration: none;">
               Для удаленного рабочего стола
             </a>
         </p>
         <p style="margin: 8px 0;">
           • <a href="http://${link}/uploads/${application.document}" style="color: #28a745; text-decoration: none;">
               Обычная ссылка
             </a>
         </p>
       </div>`
      : ""
  }

  <div style="background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <h3 style="color: #155724; margin-top: 0;">🔗 Ссылка на счет:</h3>
    <p style="margin: 8px 0;">
      • <a href="http://localhost:1823/applications?id=${application.id}" style="color: #28a745; text-decoration: none;">
          Для удаленного рабочего стола
        </a>
    </p>
    <p style="margin: 8px 0;">
      • <a href="http://${link}/applications?id=${application.id}" style="color: #28a745; text-decoration: none;">
          Обычная ссылка
        </a>
    </p>
  </div>
</div>`;
  }

  function generatePaymentRequestText(application: IApplication, manager: string, link: string): string {
    return (
      `📋 Запрос на предоставление П/П для заявки №${application.id}\n` +
      `📝 Название: ${application.title}\n\n` +
      `👤 Контрагент: ${application.counterparty?.title || "не указан"}\n` +
      `🏢 Юр. лицо: ${application.legalEntity?.title || "не указан"}\n` +
      `💰 Сумма: ${application.sum || "не указана"} руб.\n` +
      `👨‍💼 Ответственный: ${manager}\n\n` +
      (application.document
        ? `📎 Ссылка на файл:\n   • Для удаленного рабочего стола: http://localhost:1823/uploads/${application.document}\n   • Обычная ссылка: http://${link}/uploads/${application.document}\n\n`
        : "") +
      `🔗 Ссылка на заявку:\n   • Для удаленного рабочего стола: http://localhost:1823/applications?id=${application.id}\n   • Обычная ссылка: http://${link}/applications?id=${application.id}`
    );
  }

  function generatePaymentRequestHTML(application: IApplication, manager: string, link: string): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h1 style="color: #f39c12; text-align: center; border-bottom: 2px solid #f39c12; padding-bottom: 10px;">
    📋 Запрос на предоставление П/П для заявки №${application.id}
  </h1>
  
  <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p style="margin: 8px 0;"><strong>📝 Название заявки:</strong> ${application.title}</p>
    ${application.counterparty?.title ? `<p style="margin: 8px 0;"><strong>👤 Контрагент:</strong> ${application.counterparty.title}</p>` : ""}
    ${application.legalEntity?.title ? `<p style="margin: 8px 0;"><strong>🏢 Юр. лицо:</strong> ${application.legalEntity.title}</p>` : ""}
    ${application.sum ? `<p style="margin: 8px 0;"><strong>💰 Сумма:</strong> ${application.sum} руб.</p>` : ""}
    <p style="margin: 8px 0;"><strong>👨‍💼 Ответственный:</strong> ${manager}</p>
  </div>

  ${
    application.document
      ? `<div style="background: #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0;">
         <h3 style="color: #856404; margin-top: 0;">📎 Ссылка на файл:</h3>
         <p style="margin: 8px 0;">
           • <a href="http://localhost:1823/uploads/${application.document}" style="color: #e67e22; text-decoration: none;">
               Для удаленного рабочего стола
             </a>
         </p>
         <p style="margin: 8px 0;">
           • <a href="http://${link}/uploads/${application.document}" style="color: #e67e22; text-decoration: none;">
               Обычная ссылка
             </a>
         </p>
       </div>`
      : ""
  }

  <div style="background: #ffeaa7; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <h3 style="color: #856404; margin-top: 0;">🔗 Ссылка на заявку:</h3>
    <p style="margin: 8px 0;">
      • <a href="http://localhost:1823/applications?id=${application.id}" style="color: #e67e22; text-decoration: none;">
          Для удаленного рабочего стола
        </a>
    </p>
    <p style="margin: 8px 0;">
      • <a href="http://${link}/applications?id=${application.id}" style="color: #e67e22; text-decoration: none;">
          Обычная ссылка
        </a>
    </p>
  </div>
</div>`;
  }

  function generateNewProjectText(project: IProject, manager: string, link: string): string {
    return (
      `Заведён новый проект "${project?.title}"\n\n` +
      `Контрагент: ${project?.counterparty?.title || "не указан"}\n` +
      `Ответственный: ${manager}\n\n` +
      `Ссылка на проект:\n- Для удаленного рабочего стола: http://localhost:1823/project/${project?.id}\n- Обычная ссылка: http://${link}/project/${project?.id}`
    );
  }

  function generateNewProjectHTML(project: IProject, manager: string, link: string): string {
    return `<h1>Новый проект "${project?.title}"</h1>
    ${project?.counterparty?.title ? `<p><strong>Контрагент:</strong> ${project.counterparty.title}</p>` : ""}
     ${project.Legal_entity?.title ? `<p><strong>Юр. лицо:</strong> ${project.Legal_entity.title}</p>` : ""}
    <p><strong>Ответственный:</strong> ${manager}</p>
    <p><strong>Ссылка на проект:</strong><br>
    - <a href="http://localhost:1823/project/${project?.id}">Для удаленного рабочего стола</a><br>
    - <a href="http://${link}/project/${project?.id}">Обычная ссылка</a></p>`;
  }

  return {
    generatePaymentRequestHTML,
    generateNewProjectText,
    generateNewProjectHTML,
    generatePaymentText,
    generatePaymentHTML,
    generateInvoiceText,
    generateInvoiceHTML,
    generatePaymentRequestText,
  };
});

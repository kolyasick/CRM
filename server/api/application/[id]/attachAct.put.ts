import { ServerFile } from "nuxt-file-storage";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const { id } = getRouterParams(event);
  const { document, oldDocument } = await readBody<{ document?: ServerFile; oldDocument: string | null }>(event);

  try {
    if (document) {
      const fileName = document.name;
      const lastDotIndex = fileName.lastIndexOf(".");
      const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
      await storeFileLocally(document, nameWithoutExtension);
    }
    await prisma.application.update({
      where: {
        id: parseInt(id),
      },
      data: {
        actDocument: document?.name,
      },
    });

    await prisma.primaryDocument.update({
      where: {
        applicationId: parseInt(id),
      },
      data: {
        documentLink: useRuntimeConfig().public.APP_URL + "/uploads/" + document?.name,
      },
    });

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `${oldDocument ? `Редактировал акт вып. работ,\n старый акт: ${oldDocument}` : "Добавил новый акт вып. работ"}`,
          link: "/applications?id=" + id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }
  } catch (error) {
    console.error("Ошибка при добавлени/удалении акта:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при добавлени/удалении акта",
    });
  }
});

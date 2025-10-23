import { ServerFile } from "nuxt-file-storage";
import prisma from "~/lib/prisma";

type Body = {
  newFiles: ServerFile[];
  deletedFiles: string[];
};

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);

  const { id } = event.context.params as { id: string };
  const { newFiles, deletedFiles } = await readBody<Body>(event);

  console.log("Новые файлы: " + newFiles.length, "Удаленные файлы: " + deletedFiles.length);

  if (!id) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
        await storeFileLocally(file, nameWithoutExtension);
      }
    }

    const docs = await prisma.project.update({
      where: {
        id: parseInt(id),
      },
      data: {
        isCorrection: false,
        project_document: {
          deleteMany: deletedFiles.length
            ? {
                url: { in: deletedFiles.map((file: string) => file) },
              }
            : undefined,
          createMany: newFiles.length
            ? {
                data: newFiles.map((file: any) => ({ url: file.name, status_id: 1 })),
              }
            : undefined,
        },
      },
      select: {
        project_document: true,
        title: true,
        id: true,
      },
    });

    // if (deletedFiles.length > 0) {
    //   await Promise.all(
    //     deletedFiles.map(async (file: string) => {
    //       await deleteFile(file);
    //     })
    //   );
    // }

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Редактировал документы в проекте ${docs.title}`,
          link: "/project/" + docs.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return docs.project_document;
  } catch (error) {
    console.error("Error updating project document status:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update project document status",
    });
  }
});

import { ServerFile } from "nuxt-file-storage";
import prisma from "~/lib/prisma";

type Body = {
  title: string;
  description: string;
  sum: number;
  payed_sum?: number;
  counterparty_id: string;
  Legal_entity_id: number;
  status_id: number;
  deadline: string | null;
  new_files: ServerFile[];
  isPartner: boolean;
  precedent: string | null;
};

export default defineEventHandler(async (event) => {
  try {
    await requireUserSession(event);
    const { user } = await getUserSession(event);
    const body = await readBody<Body>(event);

    if (!body.title || (!body.isPartner && !body.sum) || !body.counterparty_id || !body.Legal_entity_id) {
      throw createError({
        statusCode: 400,
        message: "Заполните все обязательные поля",
      });
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        isPartner: body.isPartner,
        description: body.description || "",
        sum: body.sum,

        payed_sum: body.payed_sum ? body.payed_sum : 0,
        counterparty: {
          connect: { id: body.counterparty_id },
        },
        Legal_entity: {
          connect: { id: body.Legal_entity_id },
        },
        Project_status: {
          connect: {
            id: body.status_id ? body.status_id : undefined,
            title: !body.status_id ? "Новый" : undefined,
          },
        },
        manager: {
          connect: {
            id: user?.id,
          },
        },
        deadline: body.deadline ? new Date(body.deadline) : null,
        project_document: body.new_files
          ? {
              createMany: {
                data: body.new_files.map((file: any) => ({ url: file.name, status_id: 1 })),
              },
            }
          : undefined,
      },
      include: {
        Project_status: true,
        counterparty: true,
        Legal_entity: true,
        project_document: true,
      },
    });

    if (body.new_files.length > 0) {
      for (const file of body.new_files) {
        const fileName = file.name;
        const lastDotIndex = fileName.lastIndexOf(".");
        const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
        await storeFileLocally(file, nameWithoutExtension);
      }
    }

    if (user?.role !== "ADMIN") {
      await prisma.action.create({
        data: {
          method: event.method,
          url: event.path,
          description: `Создал новый проект "${project.title}"`,
          link: "/project/" + project.id,
          statusCode: event.node.res.statusCode,
          userId: user!.id,
        },
      });
    }

    return project;
  } catch (error: any) {
    console.error("Error creating project:", error);

    if (error.code === "P2003") {
      throw createError({
        statusCode: 400,
        message: "Invalid reference to related entity",
      });
    }

    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create project",
    });
  }
});

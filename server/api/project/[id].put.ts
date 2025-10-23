import { ServerFile } from "nuxt-file-storage";
import prisma from "~/lib/prisma";

type Body = {
  title: string;
  description: string;
  sum: number;
  payed_sum: number;
  counterparty_id: string;
  Legal_entity_id: number;
  status_id: number;
  deadline: string | null;
  new_files: ServerFile[];
  deleted_files: string[];
  precedent: string | null;
  isPartner: boolean;
};

export default defineEventHandler(async (event) => {
  await requireUserSession(event);
  const { user } = await getUserSession(event);
  const id = parseInt(event.context.params?.id as string);
  const body = await readBody<Body>(event);

  if (!body.title || (!body.isPartner && !body.sum) || !body.counterparty_id || !body.Legal_entity_id || !body.status_id) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  if (body.new_files.length > 0) {
    for (const file of body.new_files) {
      const fileName = file.name;
      const lastDotIndex = fileName.lastIndexOf(".");
      const nameWithoutExtension = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
      await storeFileLocally(file, nameWithoutExtension);
    }
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description || "",
      sum: body.sum,
      isPartner: body.isPartner,
      payed_sum: body.payed_sum,
      counterparty_id: body.counterparty_id,
      Legal_entity_id: body.Legal_entity_id,
      status_id: body.status_id,
      deadline: body.deadline ? new Date(body.deadline) : null,
      project_document: {
        deleteMany: {
          url: { in: body.deleted_files.map((file: any) => file) },
        },
        createMany: {
          data: body.new_files.map((file: any) => ({ url: file.name, status_id: 1 })),
        },
      },
    },
    include: {
      Project_status: true,
      counterparty: true,
      Legal_entity: true,
      project_document: true,
    },
  });

  if (body.deleted_files.length > 0) {
    await Promise.all(
      body.deleted_files.map(async (file: string) => {
        await deleteFile(file);
      })
    );
  }
  if (user?.role !== "ADMIN") {
    await prisma.action.create({
      data: {
        method: event.method,
        url: event.path,
        description: `Редактировал проект "${project.title}"`,
        link: "/project/" + project.id,
        statusCode: event.node.res.statusCode,
        userId: user!.id,
      },
    });
  }

  return project;
});

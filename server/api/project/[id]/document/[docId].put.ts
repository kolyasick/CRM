import prisma from "~/lib/prisma";

type Body = {
  statusId: number;
};

export default defineEventHandler(async (event) => {
  const { docId } = event.context.params as { docId: string };
  const { statusId } = await readBody<Body>(event);

  if (!statusId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  try {
    const doc = await prisma.project_document.update({
      where: { id: parseInt(docId) },
      data: {
        status_id: statusId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating project document status:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to update project document status",
    });
  }
});

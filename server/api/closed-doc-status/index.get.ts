import prisma from "~/lib/prisma";

export default defineEventHandler(async () => {
  try {
    const statuses = await prisma.closed_doc_status.findMany();

    return statuses;
  } catch (error) {
    console.error("Error fetching closed doc statuses:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch closed doc statuses",
    });
  }
});

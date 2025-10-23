import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const statuses = await prisma.project_status.findMany();

    return statuses;
  } catch (error) {
    console.error("Error fetching project statuses:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch project statuses",
    });
  }
});

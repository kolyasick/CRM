import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const statuses = await prisma.pay_status.findMany();

    return statuses;
  } catch (error) {
    console.error("Error fetching pay statuses:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch pay statuses",
    });
  }
});

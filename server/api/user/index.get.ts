import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { role } = getQuery(event) as { role?: string };
  try {
    const statuses = await prisma.user.findMany({
      where: {
        role: {
          title: role || "ADMIN",
        },
      },
      select: {
        id: true,
        full_name: true,
      },
    });

    return statuses;
  } catch (error) {
    console.error("Error fetching project statuses:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch project statuses",
    });
  }
});

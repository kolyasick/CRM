import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  try {
    await prisma.application.delete({
      where: {
        id: parseInt(id),
      },
    });
  } catch (error) {
    console.log("Ошибка при откате заявки", error);
  }
});

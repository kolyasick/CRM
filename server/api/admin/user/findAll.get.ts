import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          not: "admin@mail.ru",
        },
      },
      include: {
        role: true,
      },
      omit: {
        password: true,
      },
      orderBy: {
        id: "asc",
      },
    });
    return users;
  } catch (error) {
    console.log(error);
  }
});

import prisma from "~/lib/prisma";

type Body = {
  email: string;
  full_name: string;
  password?: string;
};
export default defineEventHandler(async (event) => {
  const { id } = event.context.params as { id: string };
  const { email, full_name, password } = await readBody<Body>(event);

  try {
    let hashedPassword;
    if (password) {
      hashedPassword = await hashPassword(password);
    }
    
    const user = await prisma.user.update({
      where: {
        id: id ? parseInt(id) : undefined,
      },
      data: {
        email,
        full_name,
        password: password ? hashedPassword : undefined,
      },
    });

    return user;
  } catch (error) {
    console.log(error);
    throw createError({
      statusCode: 500,
      message: "Ошибка при обновлении юр. лица",
    });
  }
});

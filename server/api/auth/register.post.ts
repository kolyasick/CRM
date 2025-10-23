import { registerSchema as bodySchema } from "~/utils/schemas";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { fullname, email, password } = await readValidatedBody(event, bodySchema.parse);

  const passwordHash = await hashPassword(password);

  const isUserExist = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (isUserExist) {
    throw createError({
      statusCode: 400,
      message: "Пользователь уже зарегистрирован",
    });
  }

  // const refreshToken = jwt.sign({ userId: Date.now().toString() }, process.env.REFRESH_TOKEN_SECRET || "refresh_secret_key", { expiresIn: "30d" });

  const user = await prisma.user.create({
    data: {
      full_name: fullname,
      email,
      password: passwordHash,
      is_active: true,
      role: {
        connect: {
          title: "MANAGER",
        },
      },
    },
  });

  if (!user) {
    throw createError({
      statusCode: 500,
      message: "Что то пошло не так",
    });
  }

  // setCookie(event, "MCRM_TOKEN", refreshToken, {
  //   httpOnly: false,
  //   secure: false,
  //   maxAge: 30 * 24 * 60 * 60,
  //   path: "/",
  // });

  await setUserSession(event, {
    user: {
      id: user.id,
      fullname,
      email,
    },
  });

  return user;
});

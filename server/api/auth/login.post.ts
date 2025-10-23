import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw createError({
      statusCode: 400,
      message: "Пользователь не найден",
    });
  }

  const isPasswordCorrect = await verifyPassword(user.password, password);

  if (!isPasswordCorrect) {
    throw createError({
      statusCode: 400,
      message: "Неверный пароль",
    });
  }

  // const refreshToken = jwt.sign({ userId: Date.now().toString() }, process.env.REFRESH_TOKEN_SECRET || "refresh_secret_key", { expiresIn: "30d" });

  // await prisma.user.update({
  //   where: {
  //     email,
  //   },
  //   data: {
  //     token: refreshToken,
  //   },
  // });

  await setUserSession(event, {
    user: {
      id: user.id,
      fullname: user.full_name,
      email,
      role: user.role.title,
    },
  });

  // setCookie(event, "MCRM_TOKEN", refreshToken, {
  //   httpOnly: false,
  //   secure: false,
  //   maxAge: 30 * 24 * 60 * 60,
  //   path: "/",
  // });

  await prisma.action.create({
    data: {
      method: event.method,
      url: event.path,
      description: "Вошел в аккаунт",
      statusCode: event.node.res.statusCode,
      userId: user.id,
    },
  });

  return user;
});

import nodemailer from "nodemailer";
import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.ru",
      port: 465,
      secure: true,
      auth: {
        user: "m.sergeev@lightdigital.ru",
        pass: "jFeaZeFBfTdt33c8ccRP",
      },
    });

    await transporter.sendMail(body.mailOptions);

    const user = await prisma.user.findUnique({
      where: {
        email: "admin@mail.ru",
      },
      select: {
        id: true,
      },
    });
    // await prisma.action.create({
    //   data: {
    //     method: event.method,
    //     url: event.path,
    //     description: `Отправил письмо на почту: "${body.mailOptions.subject.toLowerCase()} \n Кому: ${body.mailOptions.to}"`,
    //     statusCode: event.node.res.statusCode,
    //     userId: user!.id,
    //   },
    // });

    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    throw createError({ statusCode: 500, message: "Failed to send email" });
  }
});

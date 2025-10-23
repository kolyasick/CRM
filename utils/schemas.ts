import * as zod from "zod";

export const registerSchema = zod
  .object({
    fullname: zod
      .string()
      .min(5, {
        message: "ФИО должно содержать минимум 5 символов",
      })
      .default(""),
    email: zod
      .string()
      .email({
        message: "Пожалуйста, введите корректный email",
      })
      .default(""),
    password: zod
      .string()
      .min(8, {
        message: "Пароль должен содержать минимум 8 символов",
      })
      .default(""),
    passwordRepeat: zod.string().default(""),
  })
  .refine((data) => data.passwordRepeat && data.password === data.passwordRepeat, {
    message: "Пароли не совпадают",
    path: ["passwordRepeat"],
  });

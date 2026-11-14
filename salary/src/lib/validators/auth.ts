import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Введите email")
  .max(254, "Слишком длинный email")
  .pipe(z.email("Некорректный email"));

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть не короче 8 символов")
  .max(128, "Пароль слишком длинный (максимум 128 символов)");

export const loginSchema = z.object({
  email: emailSchema,
  // при входе длину не проверяем — только наличие
  password: z.string().min(1, "Введите пароль").max(128),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

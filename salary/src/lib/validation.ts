import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(60),
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов").max(72, "Максимум 72 символа"),
});


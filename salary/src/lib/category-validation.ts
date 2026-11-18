import { z } from "zod";
import { ICON_NAMES } from "./category-icons";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(40, "Максимум 40 символов"),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Некорректный цвет"),
  icon: z.string().refine((v) => ICON_NAMES.includes(v), "Неизвестная иконка"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

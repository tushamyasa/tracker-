import { z } from "zod";
import { TRANSACTION_TYPES } from "@/db/schema";
import { CATEGORY_ICONS } from "@/lib/icons";
import { CATEGORY_COLORS } from "@/lib/palette";

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Введите название")
  .max(40, "Не длиннее 40 символов");

export const categoryInputSchema = z.object({
  name: categoryNameSchema,
  type: z.enum(TRANSACTION_TYPES),
  icon: z.enum(CATEGORY_ICONS, "Выберите иконку"),
  color: z.enum(CATEGORY_COLORS, "Выберите цвет"),
});

export const categoryUpdateSchema = categoryInputSchema.omit({ type: true });

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

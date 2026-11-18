import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z
    .number("Введите сумму")
    .positive("Сумма должна быть больше нуля")
    .max(1_000_000_000_000, "Слишком большая сумма"),
  categoryId: z.string().min(1, "Выберите категорию"),
  /** Дата операции, миллисекунды Unix */
  date: z.number("Укажите дату").int().positive(),
  note: z.string().trim().max(200, "Максимум 200 символов").optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const filtersSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  from: z.number().optional(),
  to: z.number().optional(),
  categoryIds: z.array(z.string()).optional(),
  q: z.string().trim().max(100).optional(),
});

export type TransactionFilters = z.infer<typeof filtersSchema>;

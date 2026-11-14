import { z } from "zod";
import { TRANSACTION_TYPES } from "@/db/schema";
import { isValidDateString } from "@/lib/dates";
import { parseAmountToMinor } from "@/lib/money";

/** Форма отправляет сумму строкой; на выходе — целое число копеек. */
export const transactionInputSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.string().transform((value, ctx) => {
    const minor = parseAmountToMinor(value);
    if (minor === null) {
      ctx.addIssue({ code: "custom", message: "Введите сумму больше нуля, например 1234,56" });
      return z.NEVER;
    }
    return minor;
  }),
  categoryId: z.string().min(1, "Выберите категорию"),
  date: z.string().refine(isValidDateString, "Некорректная дата"),
  note: z
    .string()
    .trim()
    .max(200, "Не длиннее 200 символов")
    .optional()
    .transform((v) => (v ? v : null)),
});

export type TransactionInput = z.output<typeof transactionInputSchema>;

/** Фильтры списка; все поля необязательны, значения из URL проходят через safeParse. */
export const transactionFiltersSchema = z.object({
  from: z.string().refine(isValidDateString).optional().catch(undefined),
  to: z.string().refine(isValidDateString).optional().catch(undefined),
  type: z.enum(TRANSACTION_TYPES).optional().catch(undefined),
  categoryId: z.string().min(1).max(64).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100000).catch(1).default(1),
});

export type TransactionFilters = z.output<typeof transactionFiltersSchema>;

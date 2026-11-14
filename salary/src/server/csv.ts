import { formatDateRu } from "@/lib/dates";
import { minorToInputString } from "@/lib/money";
import type { TransactionRow } from "./transactions";

const SEP = ";"; // для русской локали Excel
const BOM = "﻿"; // чтобы Excel распознал UTF-8

/**
 * Экранирование ячейки: кавычки удваиваются, значение берётся в кавычки при
 * необходимости; ячейки, начинающиеся с = + - @ \t \r, получают префикс « ' »
 * (защита от CSV/formula injection в Excel).
 */
export function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const TYPE_LABEL = { income: "Доход", expense: "Расход" } as const;

/** Сумма как десятичное число с запятой, со знаком: расход отрицательный. */
function amountCell(row: TransactionRow): string {
  const abs = minorToInputString(row.amount).replace(".", ",");
  return row.type === "expense" ? `-${abs}` : abs;
}

export function transactionsToCsv(rows: TransactionRow[], currency = "RUB"): string {
  const header = ["Дата", "Тип", "Категория", `Сумма (${currency})`, "Заметка"].map(csvCell).join(SEP);
  const lines = rows.map((r) =>
    [
      formatDateRu(r.date),
      TYPE_LABEL[r.type],
      csvCell(r.categoryName),
      // знак «−» в начале суммы — это число, а не формула: не экранируем
      amountCell(r),
      csvCell(r.note ?? ""),
    ].join(SEP),
  );
  return BOM + [header, ...lines].join("\r\n") + "\r\n";
}

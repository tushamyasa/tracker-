export const CURRENCIES = [
  { code: "RUB", label: "Российский рубль (₽)" },
  { code: "USD", label: "Доллар США ($)" },
  { code: "EUR", label: "Евро (€)" },
  { code: "KZT", label: "Казахстанский тенге (₸)" },
  { code: "UAH", label: "Украинская гривна (₴)" },
  { code: "BYN", label: "Белорусский рубль (Br)" },
  { code: "GBP", label: "Фунт стерлингов (£)" },
  { code: "CNY", label: "Китайский юань (¥)" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as unknown as readonly [CurrencyCode, ...CurrencyCode[]];

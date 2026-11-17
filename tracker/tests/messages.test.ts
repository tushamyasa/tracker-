import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import ru from "../messages/ru.json";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(path, v);
    else for (const [p, s] of leaves(v, path)) out.set(p, s);
  }
  return out;
}

const ruKeys = leaves(ru as Tree);
const enKeys = leaves(en as Tree);

/** Плейсхолдеры ICU вида {count} или {count, plural, ...}: только имена переменных. */
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)(?:,|\})/g)].map((m) => m[1]).sort();

describe("словари ru/en", () => {
  it("содержат одинаковый набор ключей", () => {
    const onlyRu = [...ruKeys.keys()].filter((k) => !enKeys.has(k));
    const onlyEn = [...enKeys.keys()].filter((k) => !ruKeys.has(k));
    expect({ onlyRu, onlyEn }).toEqual({ onlyRu: [], onlyEn: [] });
  });
  it("не содержат пустых строк", () => {
    for (const [k, v] of [...ruKeys, ...enKeys]) expect(v.trim(), k).not.toBe("");
  });
  it("используют одинаковые переменные в переводах", () => {
    for (const [k, v] of ruKeys) {
      expect(placeholders(enKeys.get(k) ?? ""), k).toEqual(placeholders(v));
    }
  });
  it("английский словарь не содержит кириллицы", () => {
    for (const [k, v] of enKeys) expect(/[а-яё]/i.test(v), k).toBe(false);
  });
});

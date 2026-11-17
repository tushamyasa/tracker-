import { describe, expect, it } from "vitest";
import { parseEmail } from "@/lib/email";

describe("parseEmail", () => {
  it("принимает вымышленные адреса", () => {
    expect(parseEmail("test@test.com")).toBe("test@test.com");
    expect(parseEmail("a@b.co")).toBe("a@b.co");
  });
  it("нормализует регистр и пробелы", () => {
    expect(parseEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
  it("отклоняет некорректные адреса", () => {
    expect(parseEmail("")).toBeNull();
    expect(parseEmail("no-at-sign")).toBeNull();
    expect(parseEmail("a@")).toBeNull();
  });
});

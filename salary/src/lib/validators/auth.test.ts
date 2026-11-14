import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  const ok = { email: "  User@Example.COM ", password: "12345678", confirmPassword: "12345678" };

  it("нормализует email", () => {
    const r = registerSchema.parse(ok);
    expect(r.email).toBe("user@example.com");
  });

  it("требует пароль ≥ 8 символов", () => {
    const r = registerSchema.safeParse({ ...ok, password: "1234567", confirmPassword: "1234567" });
    expect(r.success).toBe(false);
  });

  it("требует совпадения паролей", () => {
    const r = registerSchema.safeParse({ ...ok, confirmPassword: "different1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("отклоняет некорректный email", () => {
    expect(registerSchema.safeParse({ ...ok, email: "not-an-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, email: "" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("не проверяет длину пароля, но требует его", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

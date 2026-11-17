import { describe, expect, it } from "vitest";
import { appUrl, authMode } from "@/lib/auth-config";
import { buildLoginEmail } from "@/lib/login-email";

describe("authMode", () => {
  it("по умолчанию открытый режим, email включается явно", () => {
    expect(authMode({})).toBe("open");
    expect(authMode({ AUTH_MODE: "open" })).toBe("open");
    expect(authMode({ AUTH_MODE: "email" })).toBe("email");
    expect(authMode({ AUTH_MODE: "EMAIL" })).toBe("open"); // только точное значение
    expect(authMode({ AUTH_MODE: "что-то" })).toBe("open");
  });
});

describe("appUrl", () => {
  it("возвращает origin без пути и слэша", () => {
    expect(appUrl({ APP_URL: "https://tracker.example.com/" })).toBe("https://tracker.example.com");
    expect(appUrl({ APP_URL: "http://localhost:3001/some/path" })).toBe("http://localhost:3001");
  });
  it("не принимает пустое или некорректное значение", () => {
    expect(appUrl({})).toBeNull();
    expect(appUrl({ APP_URL: "  " })).toBeNull();
    expect(appUrl({ APP_URL: "not a url" })).toBeNull();
  });
});

describe("buildLoginEmail", () => {
  const link = "https://t.example.com/auth/verify?token=abc_DEF-123";
  it("русская версия содержит ссылку, срок действия и предупреждение", () => {
    const m = buildLoginEmail("ru", link);
    expect(m.subject).toContain("Трекер тренировок");
    expect(m.text).toContain(link);
    expect(m.text).toContain("15 минут");
    expect(m.text).toContain("не запрашивали");
  });
  it("английская версия не содержит кириллицы", () => {
    const m = buildLoginEmail("en", link);
    expect(m.subject).toBe("Your Workout Tracker sign-in link");
    expect(/[а-яё]/i.test(m.text + m.html + m.subject)).toBe(false);
    expect(m.text).toContain("15 minutes");
  });
  it("незнакомая локаль — русский по умолчанию", () => {
    expect(buildLoginEmail("de", link).subject).toContain("Трекер");
  });
  it("в html ссылка экранируется", () => {
    const m = buildLoginEmail("en", 'https://x/?a=1&b="2"<script>');
    expect(m.html).toContain("&amp;");
    expect(m.html).toContain("&quot;");
    expect(m.html).not.toContain("<script>");
  });
});

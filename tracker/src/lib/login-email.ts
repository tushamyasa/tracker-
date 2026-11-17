import { LOGIN_TOKEN_TTL_MS } from "./auth-config";

export interface LoginEmail {
  subject: string;
  text: string;
  html: string;
}

const COPY = {
  ru: {
    subject: "Ссылка для входа в Трекер тренировок",
    intro: "Чтобы войти, откройте ссылку:",
    ttl: (min: number) => `Ссылка действует ${min} минут и работает один раз.`,
    ignore: "Если вы не запрашивали вход, просто проигнорируйте это письмо.",
    button: "Войти",
  },
  en: {
    subject: "Your Workout Tracker sign-in link",
    intro: "Open this link to sign in:",
    ttl: (min: number) => `The link is valid for ${min} minutes and can be used once.`,
    ignore: "If you didn't request this, you can safely ignore this email.",
    button: "Sign in",
  },
} as const;

/** Текст письма со ссылкой входа. Ссылка в html экранируется, чтобы адрес нельзя было «сломать». */
export function buildLoginEmail(locale: string, link: string): LoginEmail {
  const c = locale === "en" ? COPY.en : COPY.ru;
  const min = Math.round(LOGIN_TOKEN_TTL_MS / 60_000);
  const safe = link.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return {
    subject: c.subject,
    text: `${c.intro}\n\n${link}\n\n${c.ttl(min)}\n${c.ignore}\n`,
    html: `<p>${c.intro}</p><p><a href="${safe}">${c.button}</a></p><p>${c.ttl(min)}<br>${c.ignore}</p>`,
  };
}

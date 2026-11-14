# Salary — учёт доходов и расходов

Веб-приложение для личного учёта доходов и расходов: категории, операции, дашборд с графиками, отчёты, экспорт в CSV.
Документация проекта: [PRD-SPEC.md](../PRD-SPEC.md), [design.md](../design.md), [PLAN.md](../PLAN.md).

**Стек:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 + shadcn/ui · Turso (libSQL) + Drizzle ORM · Auth.js v5 (JWT) · Recharts · Vitest · Playwright.

## Быстрый старт

Нужен Node.js 20+ (проверено на 26).

```bash
npm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npm run db:migrate           # создаст локальную БД local.db
npm run dev                  # http://localhost:3000
```

Для локальной разработки в `.env.local` достаточно:

```
TURSO_DATABASE_URL=file:local.db
TURSO_AUTH_TOKEN=
AUTH_SECRET=любая-длинная-случайная-строка
AUTH_URL=http://localhost:3000
```

Секрет для продакшена: `npx auth secret`.

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://<db>-<org>.turso.io` или `file:local.db` для локальной разработки |
| `TURSO_AUTH_TOKEN` | токен Turso (`turso db tokens create <db>`); для `file:` не нужен |
| `AUTH_SECRET` | секрет подписи JWT-сессий |
| `AUTH_URL` | публичный адрес приложения |

## Turso

```bash
turso db create salary
turso db show salary --url          # → TURSO_DATABASE_URL
turso db tokens create salary       # → TURSO_AUTH_TOKEN
npm run db:migrate                  # применить миграции к этой БД
```

Изменили схему в `src/db/schema.ts` → `npm run db:generate`, затем `npm run db:migrate`.
Резервные копии: `turso db shell salary .dump > backup.sql` (запускать по расписанию).

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` / `npm start` | продакшен-сборка и запуск |
| `npm run lint` · `npm run typecheck` | проверки кода |
| `npm test` | юнит- и интеграционные тесты (in-memory libSQL) |
| `npm run e2e` | сквозные тесты Playwright (собирает проект, поднимает сервер на :3100 с чистой `e2e.db`) |
| `npm run db:generate` · `npm run db:migrate` | миграции Drizzle |

E2E по умолчанию используют установленный Microsoft Edge (`channel: "msedge"`), браузеры Playwright скачивать не нужно.
Другой браузер: `E2E_CHANNEL=chrome npm run e2e`.

## Структура

```
src/
  app/            маршруты: (auth) login/register, (app) dashboard/transactions/categories/reports/settings, api
  components/     ui (shadcn), layout, auth, categories, transactions, dashboard, settings
  db/             schema.ts, client.ts, migrations/
  lib/            money, dates, period, validators, rate-limit, палитра и иконки
  server/         бизнес-логика и запросы (всегда с userId), actions/ — Server Actions
  auth.ts         Auth.js; proxy.ts — защита маршрутов
e2e/              сквозные тесты
```

## Безопасность

- Пароли: argon2id. Сессия: JWT в httpOnly-cookie, 30 дней.
- Каждый запрос к данным ограничен `userId` из сессии (`requireUserId()`); изоляция пользователей покрыта тестами.
- Валидация входа на сервере (Zod), параметризованные запросы (Drizzle), экранирование CSV (защита от formula injection).
- Rate limit на вход, регистрацию, смену пароля и удаление аккаунта — **в памяти процесса**. На нескольких инстансах (Vercel) замените на общее хранилище (Upstash Redis).
- Заголовки: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`next.config.ts`).
- JWT-сессии нельзя отозвать до истечения срока: после смены пароля старые сессии остаются валидными.

## Деплой (Vercel + Turso)

1. Создайте БД в Turso и примените миграции (см. выше).
2. Импортируйте репозиторий в Vercel, задайте `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `AUTH_URL`.
3. Деплой. Проверьте регистрацию, вход и добавление операции на проде.

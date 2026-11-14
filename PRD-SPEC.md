# PRD / SPEC — Salary (учёт доходов и расходов)

Версия 0.1 · 2026-11-14 · Дизайн — см. [design.md](design.md) · План — см. [PLAN.md](PLAN.md)

---

# Часть I. PRD

## 1. Обзор
**Salary** — веб-приложение для личного учёта доходов и расходов. Пользователь регистрируется, ведёт операции по категориям и видит динамику, структуру трат и баланс.

## 2. Цели
- Быстро (≤ 10 секунд) добавить операцию с телефона и десктопа.
- Понятно показать, куда уходят деньги и сколько осталось.
- Данные каждого пользователя изолированы и защищены.

**Метрики успеха (MVP):** время добавления операции < 10 с; LCP дашборда < 2,5 с; 0 утечек данных между пользователями (подтверждено тестами).

## 3. Целевая аудитория
Частные лица, ведущие личный бюджет; нужен простой инструмент без банковских интеграций.

## 4. Границы MVP
**Входит:** авторизация, операции (CRUD), категории доходов/расходов (CRUD), дашборд, фильтры, светлая/тёмная тема, адаптив, экспорт CSV.
**Не входит (позже):** бюджеты/лимиты по категориям, повторяющиеся операции, несколько счетов и валют, импорт из банков, вложения-чеки, совместные бюджеты, PWA/офлайн, push-уведомления.

## 5. Пользовательские истории
1. Как новый пользователь, я регистрируюсь по email и паролю и сразу получаю набор категорий по умолчанию.
2. Как пользователь, я вхожу и выхожу из аккаунта; моя сессия сохраняется.
3. Как пользователь, я добавляю доход/расход: сумма, категория, дата, заметка.
4. Как пользователь, я редактирую и удаляю операции.
5. Как пользователь, я создаю, переименовываю, перекрашиваю и архивирую свои категории (отдельно для доходов и расходов).
6. Как пользователь, я вижу на дашборде баланс, доходы, расходы за период, график по месяцам, donut по категориям и последние операции.
7. Как пользователь, я фильтрую операции по периоду, типу, категории и тексту.
8. Как пользователь, я переключаю тему и валюту.
9. Как пользователь, я экспортирую операции в CSV.
10. Как пользователь, я меняю пароль и удаляю аккаунт.

## 6. Функциональные требования

### 6.1 Авторизация
- FR-A1 Регистрация: email (уникален, нормализуется в нижний регистр), пароль ≥ 8 символов.
- FR-A2 Вход по email + пароль; ошибка не раскрывает, что именно неверно.
- FR-A3 Выход; сессия — JWT в httpOnly secure cookie, срок 30 дней.
- FR-A4 Защита маршрутов: неавторизованного перенаправляет на `/login`; авторизованного с `/login` — на `/dashboard`.
- FR-A5 Ограничение попыток входа (rate limit).
- FR-A6 (после MVP) Вход через Google, сброс пароля по email.

### 6.2 Категории
- FR-C1 Категория: название (1–40 симв.), тип (`income` | `expense`), иконка (из набора), цвет (из палитры).
- FR-C2 Уникальность названия внутри пары (пользователь, тип).
- FR-C3 При регистрации создаётся набор по умолчанию:
  - Расходы: Продукты, Транспорт, Жильё, Коммуналка, Здоровье, Кафе и рестораны, Развлечения, Одежда, Связь, Подписки, Прочее.
  - Доходы: Зарплата, Аванс, Подработка, Премия, Подарки, Прочее.
- FR-C4 Удаление категории с операциями запрещено — предлагается архивировать (скрыть из выбора, история сохраняется) или перенести операции в другую категорию.

### 6.3 Операции
- FR-T1 Поля: тип, сумма (> 0), категория (тип категории = тип операции), дата, заметка (≤ 200 симв.).
- FR-T2 Создание/редактирование через drawer; удаление с подтверждением.
- FR-T3 Список с серверной пагинацией (25/стр.), сортировка по дате ↓.
- FR-T4 Фильтры: период, тип, категория(и), поиск по заметке.
- FR-T5 Все суммы хранятся в минорных единицах (копейках) как целые числа.

### 6.4 Дашборд и отчёты
- FR-D1 Период по умолчанию — текущий месяц; навигация ← →.
- FR-D2 Итоги: доходы, расходы, баланс периода; дельта к предыдущему периоду.
- FR-D3 График: доходы/расходы по месяцам за последние 12 мес.
- FR-D4 Donut: расходы по категориям за период (топ-8 + «Прочее»).
- FR-D5 Последние 10 операций.
- FR-D6 Экспорт CSV по текущим фильтрам.

### 6.5 Настройки
- FR-S1 Тема (системная / светлая / тёмная), валюта отображения (RUB по умолчанию), формат даты.
- FR-S2 Смена пароля; удаление аккаунта (с подтверждением, каскадно удаляет данные).

## 7. Нефункциональные требования
- **Безопасность:** хэш пароля argon2id (или bcrypt cost ≥ 12); все запросы к данным фильтруются по `user_id` из сессии; валидация входа Zod на сервере; CSRF-защита Server Actions/Auth.js; секреты только в env; заголовки безопасности (CSP, HSTS).
- **Производительность:** LCP < 2,5 с, TTI < 3,5 с на 4G; агрегаты считаются SQL-запросами, индексы по (`user_id`, `date`).
- **Доступность:** WCAG AA, клавиатурная навигация.
- **Совместимость:** последние 2 версии Chrome, Safari, Firefox, Edge; iOS Safari, Android Chrome.
- **Локализация:** интерфейс на русском (структура i18n-ready).
- **Надёжность:** миграции БД версионируются; ежедневный бэкап Turso (point-in-time/dump).

## 8. Риски
| Риск | Митигация |
|------|-----------|
| Утечка данных между пользователями | Единый data-access слой с обязательным `userId`; интеграционные тесты изоляции |
| Ошибки округления денег | Целые числа в копейках, без float |
| Задержка Turso для удалённых регионов | Реплика ближе к региону деплоя, кэширование агрегатов |
| Брутфорс паролей | Rate limit + задержка + argon2id |

---

# Часть II. SPEC (техническая спецификация)

## 9. Стек
| Слой | Выбор |
|------|-------|
| Фреймворк | Next.js 15 (App Router, Server Components, Server Actions), TypeScript strict |
| UI | Tailwind CSS 4, shadcn/ui, lucide-react, Recharts, sonner |
| Шрифт | Geist (`geist` npm) |
| БД | Turso (libSQL) через `@libsql/client` |
| ORM / миграции | Drizzle ORM + drizzle-kit |
| Авторизация | Auth.js v5 (Credentials provider, JWT-сессии) |
| Валидация/формы | Zod + react-hook-form |
| Хэш пароля | `@node-rs/argon2` |
| Тесты | Vitest (юнит/интеграция), Playwright (e2e) |
| Деплой | Vercel (Next.js) + Turso |
| Качество | ESLint, Prettier, GitHub Actions CI |

## 10. Архитектура
```
src/
  app/
    (auth)/login, register
    (app)/layout.tsx          # sidebar / bottom-nav, защищённая зона
    (app)/dashboard
    (app)/transactions
    (app)/categories
    (app)/reports
    (app)/settings
    api/auth/[...nextauth]
    api/export/csv
  components/ (ui/, charts/, transactions/, categories/, layout/)
  db/ (schema.ts, client.ts, migrations/, seed.ts)
  lib/ (auth.ts, money.ts, dates.ts, validators/, icons.ts, palette.ts)
  server/ (queries/, actions/)   # единственное место доступа к БД, всегда принимает userId
  middleware.ts                  # защита маршрутов
```
Правила: чтение — серверные компоненты и `server/queries`; запись — Server Actions с проверкой сессии и Zod; в клиентские компоненты данные идут через props.

## 11. Модель данных (SQLite / Turso)

```ts
users(
  id          text pk (cuid2),
  email       text not null unique,
  password_hash text not null,
  name        text,
  currency    text not null default 'RUB',
  theme       text not null default 'system',   -- system|light|dark
  created_at  integer not null (unix ms)
)

categories(
  id          text pk,
  user_id     text not null -> users.id on delete cascade,
  name        text not null,
  type        text not null check in ('income','expense'),
  icon        text not null,       -- ключ из lib/icons
  color       text not null,       -- hex из палитры
  is_archived integer not null default 0,
  created_at  integer not null,
  unique (user_id, type, name)
)

transactions(
  id          text pk,
  user_id     text not null -> users.id on delete cascade,
  category_id text not null -> categories.id on delete restrict,
  type        text not null check in ('income','expense'),
  amount      integer not null check (amount > 0),  -- минорные единицы
  date        text not null,       -- 'YYYY-MM-DD'
  note        text,
  created_at  integer not null,
  updated_at  integer not null
)
index transactions(user_id, date desc)
index transactions(user_id, category_id)
```
Инвариант: `transactions.type == categories.type` проверяется в Server Action.

## 12. Основные операции (Server Actions / Queries)
| Имя | Вход | Результат |
|-----|------|-----------|
| `registerUser` | email, password | создаёт пользователя + категории по умолчанию |
| `createTransaction` / `updateTransaction` / `deleteTransaction` | поля по FR-T1 | операция |
| `listTransactions` | фильтры, page | страница + total |
| `createCategory` / `updateCategory` / `archiveCategory` / `reassignAndDeleteCategory` | поля по FR-C1 | категория |
| `getSummary` | period | income, expense, balance, дельта |
| `getMonthlySeries` | months=12 | [{month, income, expense}] |
| `getExpenseByCategory` | period | [{category, amount, percent}] |
| `exportCsv` | фильтры | CSV (route handler) |
| `changePassword`, `deleteAccount`, `updateSettings` | — | — |

Все функции начинаются с `const userId = await requireUserId()`.

## 13. Маршруты
`/login`, `/register` — публичные. `/dashboard`, `/transactions`, `/categories`, `/reports`, `/settings` — защищены middleware. `/` → редирект на `/dashboard`.

## 14. Деньги и даты
- Хранение: целое число минорных единиц. Форматирование: `Intl.NumberFormat('ru-RU', {style:'currency', currency})`.
- Ввод: парсинг строки → копейки без float (`Math.round` только на границе ввода, с валидацией 2 знаков).
- Даты — строки `YYYY-MM-DD` (без часовых поясов); границы периода считаются на сервере.

## 15. Безопасность — чек-лист
- Хэш argon2id; пароли не логируются.
- Cookie: httpOnly, secure, sameSite=lax.
- Rate limit на `/login` и `/register` (по IP+email; Upstash или in-memory на MVP).
- Все запросы к БД через слой `server/` с `userId`; запрет прямых запросов из компонентов.
- Zod на каждом входе; параметризованные запросы (Drizzle).
- Env: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `AUTH_SECRET`, `AUTH_URL`.

## 16. Тестирование и критерии приёмки
- Юнит: money, dates, валидаторы, агрегаты.
- Интеграция (локальный libSQL-файл): пользователь A не видит и не меняет данные B (операции, категории, экспорт).
- E2E (Playwright): регистрация → вход → создание категории → добавление операции → отображение на дашборде → фильтр → экспорт → выход.
- **Приёмка MVP:** все FR из 6.1–6.5 выполнены; Lighthouse Performance/Accessibility ≥ 90 на дашборде; адаптив проверен на 360, 768, 1280 px; светлая и тёмная темы соответствуют [design.md](design.md).

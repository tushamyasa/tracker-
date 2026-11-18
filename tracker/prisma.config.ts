import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // `prisma generate` (он запускается в postinstall при каждой установке зависимостей)
    // не обращается к базе, но требует, чтобы адрес был задан. На сборочных серверах вроде Vercel
    // DATABASE_URL при установке может отсутствовать, поэтому подставляем безвредное значение.
    // Миграции (`prisma migrate deploy`) используют настоящий адрес из окружения.
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});

import path from "node:path";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_EXERCISES } from "./exercises-data";

const raw = process.env.DATABASE_URL ?? "file:./dev.db";
const url = raw.startsWith("file:")
  ? "file:" + path.resolve(__dirname, raw.slice("file:".length))
  : raw;

const db = new PrismaClient({ datasourceUrl: url });

async function main() {
  for (const [slug, nameRu, nameEn, muscleGroup, equipment, kind] of SEED_EXERCISES) {
    await db.exercise.upsert({
      where: { slug },
      update: { nameRu, nameEn, muscleGroup, equipment, kind },
      create: { slug, nameRu, nameEn, muscleGroup, equipment, kind },
    });
  }
  console.log(`Seeded ${SEED_EXERCISES.length} system exercises`);
}

main().finally(() => db.$disconnect());

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_EXERCISES } from "./exercises-data";

const db = new PrismaClient();

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

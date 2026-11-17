-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "goal" TEXT,
    "experience" TEXT,
    "weeklyGoal" INTEGER NOT NULL DEFAULT 3,
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "units" TEXT NOT NULL DEFAULT 'kg',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "effectsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "restDefaultSec" INTEGER NOT NULL DEFAULT 90,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "effectsEnabled", "email", "id", "locale", "name", "units", "xp") SELECT "createdAt", "effectsEnabled", "email", "id", "locale", "name", "units", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

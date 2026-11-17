-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "weightKg" REAL,
    "bodyFatPct" REAL,
    "chestCm" REAL,
    "waistCm" REAL,
    "hipsCm" REAL,
    "armCm" REAL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BodyMeasurement_userId_date_key" ON "BodyMeasurement"("userId", "date");

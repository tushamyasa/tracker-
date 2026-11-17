-- CreateTable
CREATE TABLE "LoginToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginToken_tokenHash_key" ON "LoginToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LoginToken_email_idx" ON "LoginToken"("email");

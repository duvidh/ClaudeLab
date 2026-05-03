-- Sprint 2 Infrastructure Migration

-- 1. Add permissions column to Employee
ALTER TABLE "Employee" ADD COLUMN "permissions" TEXT;

-- 2. Make Quote.clientId optional and add Quote.leadId
--    SQLite requires a full table rebuild to change column nullability
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "projectId" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "discount" REAL NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" SELECT "id", "quoteNumber", "clientId", NULL, "projectId", "date", "validUntil", "status", "version", "discount", "paymentTerms", "notes", "createdAt", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
PRAGMA foreign_keys=ON;

-- 3. Create Document model (unified file metadata for Leads & Clients)
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT,
    "clientId" TEXT,
    "leadId" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

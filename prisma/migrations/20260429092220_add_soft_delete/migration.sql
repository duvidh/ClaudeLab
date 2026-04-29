-- AlterTable
ALTER TABLE "Client" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "deletedAt" DATETIME;

/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `agents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `branchId` to the `agents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "address" TEXT,
ADD COLUMN     "autoConvertReferrals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "branchId" BIGINT NOT NULL,
ADD COLUMN     "canSubmitApplications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "idProofUrl" TEXT,
ADD COLUMN     "incorporationCertUrl" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "pointOfContactId" BIGINT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "referredByAgentId" BIGINT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "referredByAgentId" BIGINT;

-- CreateTable
CREATE TABLE "app_settings" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_tenantId_key_key" ON "app_settings"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "agents_userId_key" ON "agents"("userId");

-- CreateIndex
CREATE INDEX "leads_tenantId_referredByAgentId_idx" ON "leads"("tenantId", "referredByAgentId");

-- CreateIndex
CREATE INDEX "students_tenantId_referredByAgentId_idx" ON "students"("tenantId", "referredByAgentId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_referredByAgentId_fkey" FOREIGN KEY ("referredByAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_referredByAgentId_fkey" FOREIGN KEY ("referredByAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_pointOfContactId_fkey" FOREIGN KEY ("pointOfContactId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

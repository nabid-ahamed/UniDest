-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "agentId" BIGINT;

-- CreateTable
CREATE TABLE "agents" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "agentId" BIGINT NOT NULL,
    "applicationId" BIGINT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "statusId" BIGINT NOT NULL,
    "paidAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_statuses" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "commission_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_publicId_key" ON "agents"("publicId");

-- CreateIndex
CREATE INDEX "agents_tenantId_deletedAt_idx" ON "agents"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agents_tenantId_name_key" ON "agents"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_publicId_key" ON "commissions"("publicId");

-- CreateIndex
CREATE INDEX "commissions_tenantId_agentId_idx" ON "commissions"("tenantId", "agentId");

-- CreateIndex
CREATE INDEX "commissions_tenantId_applicationId_idx" ON "commissions"("tenantId", "applicationId");

-- CreateIndex
CREATE INDEX "commissions_tenantId_statusId_idx" ON "commissions"("tenantId", "statusId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_statuses_publicId_key" ON "commission_statuses"("publicId");

-- CreateIndex
CREATE INDEX "commission_statuses_tenantId_sortOrder_idx" ON "commission_statuses"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "commission_statuses_tenantId_key_key" ON "commission_statuses"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "commission_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


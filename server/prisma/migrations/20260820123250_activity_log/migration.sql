-- CreateTable
CREATE TABLE "activity_log" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "userId" BIGINT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" BIGINT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_log_publicId_key" ON "activity_log"("publicId");

-- CreateIndex
CREATE INDEX "activity_log_tenantId_entityType_entityId_idx" ON "activity_log"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_log_tenantId_createdAt_idx" ON "activity_log"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


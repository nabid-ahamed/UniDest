-- CreateTable
CREATE TABLE "announcements" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT 'All',
    "createdById" BIGINT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_reads" (
    "id" BIGSERIAL NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "userId" BIGINT NOT NULL,
    "notificationKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "announcements_publicId_key" ON "announcements"("publicId");

-- CreateIndex
CREATE INDEX "announcements_tenantId_publishedAt_idx" ON "announcements"("tenantId", "publishedAt");

-- CreateIndex
CREATE INDEX "announcements_tenantId_deletedAt_idx" ON "announcements"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "notification_reads_tenantId_userId_idx" ON "notification_reads"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_reads_userId_notificationKey_key" ON "notification_reads"("userId", "notificationKey");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable
CREATE TABLE "service_requests" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "studentId" BIGINT NOT NULL,
    "statusId" BIGINT NOT NULL,
    "service" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "assignedToId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_statuses" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "service_request_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_messages" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "requestId" BIGINT NOT NULL,
    "authorId" BIGINT,
    "authorName" TEXT NOT NULL,
    "fromStaff" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_publicId_key" ON "service_requests"("publicId");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_statusId_idx" ON "service_requests"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_studentId_idx" ON "service_requests"("tenantId", "studentId");

-- CreateIndex
CREATE INDEX "service_requests_tenantId_deletedAt_idx" ON "service_requests"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_request_statuses_publicId_key" ON "service_request_statuses"("publicId");

-- CreateIndex
CREATE INDEX "service_request_statuses_tenantId_sortOrder_idx" ON "service_request_statuses"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "service_request_statuses_tenantId_key_key" ON "service_request_statuses"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "service_request_messages_publicId_key" ON "service_request_messages"("publicId");

-- CreateIndex
CREATE INDEX "service_request_messages_tenantId_requestId_idx" ON "service_request_messages"("tenantId", "requestId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "service_request_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_messages" ADD CONSTRAINT "service_request_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

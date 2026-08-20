-- CreateTable
CREATE TABLE "tickets" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "studentId" BIGINT,
    "leadId" BIGINT,
    "branchId" BIGINT,
    "assignedToId" BIGINT,
    "statusId" BIGINT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_statuses" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ticket_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "ticketId" BIGINT NOT NULL,
    "authorId" BIGINT,
    "authorName" TEXT NOT NULL,
    "fromStaff" BOOLEAN NOT NULL DEFAULT false,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_publicId_key" ON "tickets"("publicId");

-- CreateIndex
CREATE INDEX "tickets_tenantId_statusId_idx" ON "tickets"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "tickets_tenantId_assignedToId_idx" ON "tickets"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "tickets_tenantId_deletedAt_idx" ON "tickets"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statuses_publicId_key" ON "ticket_statuses"("publicId");

-- CreateIndex
CREATE INDEX "ticket_statuses_tenantId_sortOrder_idx" ON "ticket_statuses"("tenantId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_statuses_tenantId_key_key" ON "ticket_statuses"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_messages_publicId_key" ON "ticket_messages"("publicId");

-- CreateIndex
CREATE INDEX "ticket_messages_tenantId_ticketId_idx" ON "ticket_messages"("tenantId", "ticketId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "ticket_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


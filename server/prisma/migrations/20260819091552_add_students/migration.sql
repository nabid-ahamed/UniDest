-- CreateTable
CREATE TABLE "students" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "studentNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "phoneNote" TEXT,
    "gender" TEXT,
    "source" TEXT,
    "branchId" BIGINT,
    "assignedToId" BIGINT,
    "statusId" BIGINT NOT NULL,
    "residenceCountryId" BIGINT,
    "interestCountryId" BIGINT,
    "studyLevel" TEXT,
    "course" TEXT,
    "intake" TEXT,
    "university" TEXT,
    "avatarUrl" TEXT,
    "leadId" BIGINT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_publicId_key" ON "students"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "students_studentNo_key" ON "students"("studentNo");

-- CreateIndex
CREATE UNIQUE INDEX "students_leadId_key" ON "students"("leadId");

-- CreateIndex
CREATE INDEX "students_tenantId_statusId_idx" ON "students"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "students_tenantId_assignedToId_idx" ON "students"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "students_tenantId_deletedAt_idx" ON "students"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "student_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_residenceCountryId_fkey" FOREIGN KEY ("residenceCountryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_interestCountryId_fkey" FOREIGN KEY ("interestCountryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

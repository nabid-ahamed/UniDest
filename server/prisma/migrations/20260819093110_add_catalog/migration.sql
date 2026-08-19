-- CreateTable
CREATE TABLE "universities" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT,
    "countryId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "type" TEXT,
    "established" INTEGER,
    "ranking" INTEGER,
    "showToAgent" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_categories" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT,
    "name" TEXT NOT NULL,
    "parentId" BIGINT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "course_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT,
    "universityId" BIGINT NOT NULL,
    "categoryId" BIGINT,
    "title" TEXT NOT NULL,
    "studyLevel" TEXT,
    "durationYears" INTEGER,
    "durationMonths" INTEGER,
    "tuitionFee" DECIMAL(12,2),
    "applicationFee" DECIMAL(12,2),
    "currency" VARCHAR(3),
    "commissionType" TEXT,
    "commissionValue" TEXT,
    "requirements" JSONB NOT NULL DEFAULT '{}',
    "description" TEXT,
    "entryRequirements" TEXT,
    "websiteUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Enabled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intakes" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT,
    "courseId" BIGINT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER,
    "applicationDeadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "universities_publicId_key" ON "universities"("publicId");

-- CreateIndex
CREATE INDEX "universities_tenantId_idx" ON "universities"("tenantId");

-- CreateIndex
CREATE INDEX "universities_countryId_idx" ON "universities"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "universities_name_countryId_key" ON "universities"("name", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_publicId_key" ON "course_categories"("publicId");

-- CreateIndex
CREATE INDEX "course_categories_tenantId_idx" ON "course_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_name_parentId_key" ON "course_categories"("name", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_publicId_key" ON "courses"("publicId");

-- CreateIndex
CREATE INDEX "courses_tenantId_idx" ON "courses"("tenantId");

-- CreateIndex
CREATE INDEX "courses_universityId_idx" ON "courses"("universityId");

-- CreateIndex
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "intakes_publicId_key" ON "intakes"("publicId");

-- CreateIndex
CREATE INDEX "intakes_tenantId_idx" ON "intakes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "intakes_courseId_month_year_key" ON "intakes"("courseId", "month", "year");

-- AddForeignKey
ALTER TABLE "universities" ADD CONSTRAINT "universities_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_categories" ADD CONSTRAINT "course_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "webinars" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "topic" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "audienceType" TEXT NOT NULL DEFAULT 'Student',
    "webinarLink" TEXT,
    "description" TEXT,
    "notifiedEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinar_enrollments" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "webinarId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userType" TEXT NOT NULL DEFAULT 'Student',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webinar_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_content" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "authorId" BIGINT,
    "publishedAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cms_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_items" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_categories" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "resource_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_resources" (
    "id" BIGSERIAL NOT NULL,
    "publicId" UUID NOT NULL,
    "tenantId" BIGINT NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "categoryId" BIGINT,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "relatedCourseId" BIGINT,
    "uploadedById" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "student_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webinars_publicId_key" ON "webinars"("publicId");

-- CreateIndex
CREATE INDEX "webinars_tenantId_startsAt_idx" ON "webinars"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "webinars_tenantId_deletedAt_idx" ON "webinars"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_enrollments_publicId_key" ON "webinar_enrollments"("publicId");

-- CreateIndex
CREATE INDEX "webinar_enrollments_tenantId_webinarId_idx" ON "webinar_enrollments"("tenantId", "webinarId");

-- CreateIndex
CREATE UNIQUE INDEX "webinar_enrollments_webinarId_email_key" ON "webinar_enrollments"("webinarId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_publicId_key" ON "cms_content"("publicId");

-- CreateIndex
CREATE INDEX "cms_content_tenantId_kind_status_idx" ON "cms_content"("tenantId", "kind", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_tenantId_kind_slug_key" ON "cms_content"("tenantId", "kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_publicId_key" ON "newsletter_subscribers"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_tenantId_email_key" ON "newsletter_subscribers"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "media_items_publicId_key" ON "media_items"("publicId");

-- CreateIndex
CREATE INDEX "media_items_tenantId_type_idx" ON "media_items"("tenantId", "type");

-- CreateIndex
CREATE INDEX "media_items_tenantId_deletedAt_idx" ON "media_items"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "resource_categories_publicId_key" ON "resource_categories"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_categories_tenantId_name_key" ON "resource_categories"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "student_resources_publicId_key" ON "student_resources"("publicId");

-- CreateIndex
CREATE INDEX "student_resources_tenantId_categoryId_idx" ON "student_resources"("tenantId", "categoryId");

-- CreateIndex
CREATE INDEX "student_resources_tenantId_deletedAt_idx" ON "student_resources"("tenantId", "deletedAt");

-- AddForeignKey
ALTER TABLE "webinar_enrollments" ADD CONSTRAINT "webinar_enrollments_webinarId_fkey" FOREIGN KEY ("webinarId") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_items" ADD CONSTRAINT "media_items_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resources" ADD CONSTRAINT "student_resources_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "resource_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resources" ADD CONSTRAINT "student_resources_relatedCourseId_fkey" FOREIGN KEY ("relatedCourseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_resources" ADD CONSTRAINT "student_resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


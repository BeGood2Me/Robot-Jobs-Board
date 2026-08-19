-- CreateEnum
CREATE TYPE "SourceSystem" AS ENUM ('greenhouse', 'lever', 'ashby', 'joblistingsapi');

-- CreateEnum
CREATE TYPE "WorkplaceType" AS ENUM ('ONSITE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "seoIntro" TEXT NOT NULL,
    "logoUrl" TEXT,
    "sourceSystem" "SourceSystem" NOT NULL,
    "sourceIdentifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceSystem" "SourceSystem" NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "descriptionPlain" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "locationRaw" TEXT NOT NULL,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "workplaceType" "WorkplaceType" NOT NULL DEFAULT 'ONSITE',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "department" TEXT,
    "compensationText" TEXT,
    "postedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobotDomain" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "RobotDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobRobotDomain" (
    "jobId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,

    CONSTRAINT "JobRobotDomain_pkey" PRIMARY KEY ("jobId","domainId")
);

-- CreateTable
CREATE TABLE "TechTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TechTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTechTag" (
    "jobId" TEXT NOT NULL,
    "techTagId" TEXT NOT NULL,

    CONSTRAINT "JobTechTag_pkey" PRIMARY KEY ("jobId","techTagId")
);

-- CreateTable
CREATE TABLE "SeniorityLevel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SeniorityLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobSeniority" (
    "jobId" TEXT NOT NULL,
    "seniorityId" TEXT NOT NULL,

    CONSTRAINT "JobSeniority_pkey" PRIMARY KEY ("jobId","seniorityId")
);

-- CreateTable
CREATE TABLE "SourceFeedConfig" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceSystem" "SourceSystem" NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceFeedConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE INDEX "Company_slug_idx" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_sourceSystem_sourceIdentifier_key" ON "Company"("sourceSystem", "sourceIdentifier");

-- CreateIndex
CREATE INDEX "Job_isActive_idx" ON "Job"("isActive");

-- CreateIndex
CREATE INDEX "Job_isActive_true_idx" ON "Job"("isActive") WHERE "isActive" = true;

-- CreateIndex
CREATE INDEX "Job_sourceSystem_idx" ON "Job"("sourceSystem");

-- CreateIndex
CREATE INDEX "Job_companyId_idx" ON "Job"("companyId");

-- CreateIndex
CREATE INDEX "Job_country_idx" ON "Job"("country");

-- CreateIndex
CREATE INDEX "Job_city_idx" ON "Job"("city");

-- CreateIndex
CREATE INDEX "Job_postedAt_idx" ON "Job"("postedAt");

-- CreateIndex
CREATE INDEX "Job_slug_idx" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_isActive_postedAt_idx" ON "Job"("isActive", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Job_sourceSystem_externalId_key" ON "Job"("sourceSystem", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "RobotDomain_slug_key" ON "RobotDomain"("slug");

-- CreateIndex
CREATE INDEX "JobRobotDomain_domainId_idx" ON "JobRobotDomain"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "TechTag_slug_key" ON "TechTag"("slug");

-- CreateIndex
CREATE INDEX "JobTechTag_techTagId_idx" ON "JobTechTag"("techTagId");

-- CreateIndex
CREATE UNIQUE INDEX "SeniorityLevel_slug_key" ON "SeniorityLevel"("slug");

-- CreateIndex
CREATE INDEX "JobSeniority_seniorityId_idx" ON "JobSeniority"("seniorityId");

-- CreateIndex
CREATE INDEX "SourceFeedConfig_active_idx" ON "SourceFeedConfig"("active");

-- CreateIndex
CREATE INDEX "SourceFeedConfig_sourceSystem_idx" ON "SourceFeedConfig"("sourceSystem");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRobotDomain" ADD CONSTRAINT "JobRobotDomain_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobRobotDomain" ADD CONSTRAINT "JobRobotDomain_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "RobotDomain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTechTag" ADD CONSTRAINT "JobTechTag_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTechTag" ADD CONSTRAINT "JobTechTag_techTagId_fkey" FOREIGN KEY ("techTagId") REFERENCES "TechTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSeniority" ADD CONSTRAINT "JobSeniority_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobSeniority" ADD CONSTRAINT "JobSeniority_seniorityId_fkey" FOREIGN KEY ("seniorityId") REFERENCES "SeniorityLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceFeedConfig" ADD CONSTRAINT "SourceFeedConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

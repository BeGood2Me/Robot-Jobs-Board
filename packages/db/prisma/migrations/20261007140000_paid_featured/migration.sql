-- AlterEnum
ALTER TYPE "SourceSystem" ADD VALUE 'direct';

-- CreateEnum
CREATE TYPE "PaidListingStatus" AS ENUM ('draft', 'paid', 'expired');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN "featuredUntil" TIMESTAMP(3),
ADD COLUMN "featuredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Job_featuredUntil_idx" ON "Job"("featuredUntil");

-- CreateTable
CREATE TABLE "PaidListing" (
    "id" TEXT NOT NULL,
    "status" "PaidListingStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "applyUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "locationRaw" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "isRemote" BOOLEAN NOT NULL DEFAULT false,
    "workplaceType" "WorkplaceType" NOT NULL DEFAULT 'ONSITE',
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "compensationText" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "jobId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaidListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaidListing_stripeSessionId_key" ON "PaidListing"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaidListing_jobId_key" ON "PaidListing"("jobId");

-- CreateIndex
CREATE INDEX "PaidListing_status_idx" ON "PaidListing"("status");

-- CreateIndex
CREATE INDEX "PaidListing_buyerEmail_idx" ON "PaidListing"("buyerEmail");

-- AddForeignKey
ALTER TABLE "PaidListing" ADD CONSTRAINT "PaidListing_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

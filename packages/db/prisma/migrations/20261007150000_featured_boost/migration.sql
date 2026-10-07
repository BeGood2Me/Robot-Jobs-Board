-- AlterTable
ALTER TABLE "PaidListing" ADD COLUMN "targetJobId" TEXT,
ADD COLUMN "targetJobSlug" TEXT;

-- CreateIndex
CREATE INDEX "PaidListing_targetJobId_idx" ON "PaidListing"("targetJobId");

-- CreateTable
CREATE TABLE "FeaturedBoost" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "featuredAt" TIMESTAMP(3) NOT NULL,
    "featuredUntil" TIMESTAMP(3) NOT NULL,
    "stripeSessionId" TEXT,
    "paidListingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedBoost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBoost_jobId_key" ON "FeaturedBoost"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBoost_stripeSessionId_key" ON "FeaturedBoost"("stripeSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedBoost_paidListingId_key" ON "FeaturedBoost"("paidListingId");

-- CreateIndex
CREATE INDEX "FeaturedBoost_featuredUntil_idx" ON "FeaturedBoost"("featuredUntil");

-- AddForeignKey
ALTER TABLE "FeaturedBoost" ADD CONSTRAINT "FeaturedBoost_paidListingId_fkey" FOREIGN KEY ("paidListingId") REFERENCES "PaidListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

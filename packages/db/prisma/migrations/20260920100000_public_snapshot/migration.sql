-- CreateTable
CREATE TABLE "PublicSnapshot" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "jobCount" INTEGER NOT NULL,
    "companyCount" INTEGER NOT NULL,
    "manifestJson" TEXT NOT NULL,
    "boardGz" BYTEA NOT NULL,
    "bodiesGz" BYTEA NOT NULL,
    "sitemapJobs" TEXT NOT NULL,
    "sitemapCategories" TEXT NOT NULL,
    "sitemapCompanies" TEXT NOT NULL,
    "sitemapBlog" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicSnapshot_pkey" PRIMARY KEY ("id")
);

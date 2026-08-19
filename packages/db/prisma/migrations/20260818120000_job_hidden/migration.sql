-- AlterTable
ALTER TABLE "Job" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "hiddenAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "hiddenNote" TEXT;

-- CreateIndex
CREATE INDEX "Job_isHidden_idx" ON "Job"("isHidden");
CREATE INDEX "Job_isActive_isHidden_idx" ON "Job"("isActive", "isHidden");

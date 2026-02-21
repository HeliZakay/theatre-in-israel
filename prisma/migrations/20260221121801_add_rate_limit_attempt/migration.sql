-- CreateTable
CREATE TABLE "RateLimitAttempt" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitAttempt_key_action_createdAt_idx" ON "RateLimitAttempt"("key", "action", "createdAt");

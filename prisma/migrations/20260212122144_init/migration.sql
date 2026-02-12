-- CreateTable
CREATE TABLE "public"."urls" (
    "id" SERIAL NOT NULL,
    "short_code" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clicks" (
    "id" SERIAL NOT NULL,
    "url_id" INTEGER NOT NULL,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "referrer" TEXT,

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "urls_short_code_key" ON "public"."urls"("short_code");

-- CreateIndex
CREATE INDEX "clicks_url_id_idx" ON "public"."clicks"("url_id");

-- CreateIndex
CREATE INDEX "clicks_clicked_at_idx" ON "public"."clicks"("clicked_at");

-- AddForeignKey
ALTER TABLE "public"."clicks" ADD CONSTRAINT "clicks_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

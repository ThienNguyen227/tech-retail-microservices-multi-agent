-- CreateTable
CREATE TABLE "promotion" (
    "promotion_id" SERIAL NOT NULL,
    "promotion_name" TEXT NOT NULL,
    "promotion_description" TEXT NOT NULL,
    "promotion_start_at" TIMESTAMP(3) NOT NULL,
    "promotion_end_at" TIMESTAMP(3) NOT NULL,
    "promotion_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotion_updated_at" TIMESTAMP(3) NOT NULL,
    "promotion_promotion_type_id" INTEGER NOT NULL,
    "promotion_status_id" INTEGER NOT NULL,

    CONSTRAINT "promotion_pkey" PRIMARY KEY ("promotion_id")
);

-- CreateTable
CREATE TABLE "promotion_type" (
    "promotion_type_id" SERIAL NOT NULL,
    "promotion_type_name" TEXT NOT NULL,
    "promotion_type_code" TEXT NOT NULL,
    "promotion_type_description" TEXT NOT NULL,

    CONSTRAINT "promotion_type_pkey" PRIMARY KEY ("promotion_type_id")
);

-- CreateTable
CREATE TABLE "promotion_status" (
    "promotion_status_id" SERIAL NOT NULL,
    "promotion_status_name" TEXT NOT NULL,
    "promotion_status_code" TEXT NOT NULL,
    "promotion_status_description" TEXT NOT NULL,

    CONSTRAINT "promotion_status_pkey" PRIMARY KEY ("promotion_status_id")
);

-- CreateTable
CREATE TABLE "promotion_sku" (
    "promotion_sku_id" SERIAL NOT NULL,
    "promotion_sku_sku" TEXT NOT NULL,
    "promotion_sku_discount_value" DECIMAL(15,2) NOT NULL,
    "promotion_sku_promotion_id" INTEGER NOT NULL,
    "promotion_sku_discount_type_id" INTEGER NOT NULL,

    CONSTRAINT "promotion_sku_pkey" PRIMARY KEY ("promotion_sku_id")
);

-- CreateTable
CREATE TABLE "promotion_coupon" (
    "promotion_coupon_id" SERIAL NOT NULL,
    "promotion_coupon_code" TEXT NOT NULL,
    "promotion_coupon_value" DECIMAL(15,2) NOT NULL,
    "promotion_coupon_min_order_value" DECIMAL(15,2) NOT NULL,
    "promotion_coupon_max_discount_value" DECIMAL(15,2),
    "promotion_coupon_usage_limit" INTEGER NOT NULL,
    "promotion_coupon_used_count" INTEGER NOT NULL DEFAULT 0,
    "promotion_coupon_promotion_id" INTEGER NOT NULL,
    "promotion_coupon_discount_type_id" INTEGER NOT NULL,

    CONSTRAINT "promotion_coupon_pkey" PRIMARY KEY ("promotion_coupon_id")
);

-- CreateTable
CREATE TABLE "discount_type" (
    "discount_type_id" SERIAL NOT NULL,
    "discount_type_name" TEXT NOT NULL,
    "discount_type_description" TEXT NOT NULL,

    CONSTRAINT "discount_type_pkey" PRIMARY KEY ("discount_type_id")
);

-- CreateIndex
CREATE INDEX "promotion_promotion_promotion_type_id_idx" ON "promotion"("promotion_promotion_type_id");

-- CreateIndex
CREATE INDEX "promotion_promotion_status_id_idx" ON "promotion"("promotion_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_type_promotion_type_code_key" ON "promotion_type"("promotion_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_status_promotion_status_code_key" ON "promotion_status"("promotion_status_code");

-- CreateIndex
CREATE INDEX "promotion_sku_promotion_sku_sku_idx" ON "promotion_sku"("promotion_sku_sku");

-- CreateIndex
CREATE INDEX "promotion_sku_promotion_sku_discount_type_id_idx" ON "promotion_sku"("promotion_sku_discount_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_sku_promotion_sku_promotion_id_promotion_sku_sku_key" ON "promotion_sku"("promotion_sku_promotion_id", "promotion_sku_sku");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_coupon_promotion_coupon_code_key" ON "promotion_coupon"("promotion_coupon_code");

-- CreateIndex
CREATE INDEX "promotion_coupon_promotion_coupon_promotion_id_idx" ON "promotion_coupon"("promotion_coupon_promotion_id");

-- CreateIndex
CREATE INDEX "promotion_coupon_promotion_coupon_discount_type_id_idx" ON "promotion_coupon"("promotion_coupon_discount_type_id");

-- AddForeignKey
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_promotion_promotion_type_id_fkey" FOREIGN KEY ("promotion_promotion_type_id") REFERENCES "promotion_type"("promotion_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_promotion_status_id_fkey" FOREIGN KEY ("promotion_status_id") REFERENCES "promotion_status"("promotion_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_sku" ADD CONSTRAINT "promotion_sku_promotion_sku_promotion_id_fkey" FOREIGN KEY ("promotion_sku_promotion_id") REFERENCES "promotion"("promotion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_sku" ADD CONSTRAINT "promotion_sku_promotion_sku_discount_type_id_fkey" FOREIGN KEY ("promotion_sku_discount_type_id") REFERENCES "discount_type"("discount_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_coupon" ADD CONSTRAINT "promotion_coupon_promotion_coupon_promotion_id_fkey" FOREIGN KEY ("promotion_coupon_promotion_id") REFERENCES "promotion"("promotion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_coupon" ADD CONSTRAINT "promotion_coupon_promotion_coupon_discount_type_id_fkey" FOREIGN KEY ("promotion_coupon_discount_type_id") REFERENCES "discount_type"("discount_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

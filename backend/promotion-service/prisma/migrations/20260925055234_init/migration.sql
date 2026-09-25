/*
  Warnings:

  - You are about to drop the column `promotion_coupon_discount_type_id` on the `promotion_coupon` table. All the data in the column will be lost.
  - You are about to drop the column `promotion_sku_discount_type_id` on the `promotion_sku` table. All the data in the column will be lost.
  - You are about to drop the `discount_type` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `promotion_coupon_promotion_discount_type_id` to the `promotion_coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promotion_sku_promotion_discount_type_id` to the `promotion_sku` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "promotion_coupon" DROP CONSTRAINT "promotion_coupon_promotion_coupon_discount_type_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_sku" DROP CONSTRAINT "promotion_sku_promotion_sku_discount_type_id_fkey";

-- DropIndex
DROP INDEX "promotion_coupon_promotion_coupon_discount_type_id_idx";

-- DropIndex
DROP INDEX "promotion_sku_promotion_sku_discount_type_id_idx";

-- AlterTable
ALTER TABLE "promotion_coupon" DROP COLUMN "promotion_coupon_discount_type_id",
ADD COLUMN     "promotion_coupon_promotion_discount_type_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "promotion_sku" DROP COLUMN "promotion_sku_discount_type_id",
ADD COLUMN     "promotion_sku_promotion_discount_type_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "discount_type";

-- CreateTable
CREATE TABLE "promotion_discount_type" (
    "promotion_discount_type_id" SERIAL NOT NULL,
    "promotion_discount_type_name" TEXT NOT NULL,
    "promotion_discount_type_code" TEXT NOT NULL,
    "promotion_discount_type_description" TEXT NOT NULL,

    CONSTRAINT "promotion_discount_type_pkey" PRIMARY KEY ("promotion_discount_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotion_discount_type_promotion_discount_type_code_key" ON "promotion_discount_type"("promotion_discount_type_code");

-- CreateIndex
CREATE INDEX "promotion_coupon_promotion_coupon_promotion_discount_type_i_idx" ON "promotion_coupon"("promotion_coupon_promotion_discount_type_id");

-- CreateIndex
CREATE INDEX "promotion_sku_promotion_sku_promotion_discount_type_id_idx" ON "promotion_sku"("promotion_sku_promotion_discount_type_id");

-- AddForeignKey
ALTER TABLE "promotion_sku" ADD CONSTRAINT "promotion_sku_promotion_sku_promotion_discount_type_id_fkey" FOREIGN KEY ("promotion_sku_promotion_discount_type_id") REFERENCES "promotion_discount_type"("promotion_discount_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_coupon" ADD CONSTRAINT "promotion_coupon_promotion_coupon_promotion_discount_type__fkey" FOREIGN KEY ("promotion_coupon_promotion_discount_type_id") REFERENCES "promotion_discount_type"("promotion_discount_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
